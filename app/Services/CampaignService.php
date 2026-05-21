<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\CollaborationRequest;
use App\Models\Negotiation;
use App\Models\ActivityLog;
use App\Models\User;
use App\Repositories\Contracts\CampaignRepositoryInterface;
use App\Jobs\SendNotificationJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CampaignService
{
    public function __construct(
        private readonly CampaignRepositoryInterface $campaignRepo
    ) {}

    public function create(int $clientId, array $data): Campaign
    {
        $data['client_id'] = $clientId;
        $campaign = $this->campaignRepo->create($data);

        $this->logActivity($clientId, 'create_campaign', 'campaign', $campaign->id);

        return $campaign;
    }

    public function update(int $id, int $clientId, array $data): Campaign
    {
        $campaign = $this->campaignRepo->findById($id);

        if ($campaign->client_id !== $clientId) {
            throw ValidationException::withMessages(['campaign' => ['Unauthorized.']]);
        }

        $campaign = $this->campaignRepo->update($id, $data);
        $this->logActivity($clientId, 'update_campaign', 'campaign', $id);

        return $campaign;
    }

    public function delete(int $id, int $clientId): void
    {
        $campaign = $this->campaignRepo->findById($id);

        if ($campaign->client_id !== $clientId) {
            throw ValidationException::withMessages(['campaign' => ['Unauthorized.']]);
        }

        $this->campaignRepo->delete($id);
        $this->logActivity($clientId, 'delete_campaign', 'campaign', $id);
    }

    public function publish(int $id, int $clientId): Campaign
    {
        $campaign = $this->campaignRepo->findById($id);

        if ($campaign->client_id !== $clientId) {
            throw ValidationException::withMessages(['campaign' => ['Unauthorized.']]);
        }
        if ($campaign->status !== 'draft') {
            throw ValidationException::withMessages(['campaign' => ['Only draft campaigns can be published.']]);
        }

        $this->campaignRepo->updateStatus($id, 'published');
        $this->logActivity($clientId, 'publish_campaign', 'campaign', $id);

        return $campaign->fresh();
    }

    public function sendCollaborationRequest(int $campaignId, int $influencerId, int $clientId, array $data): CollaborationRequest
    {
        $campaign = $this->campaignRepo->findById($campaignId);

        if ($campaign->client_id !== $clientId) {
            throw ValidationException::withMessages(['campaign' => ['Unauthorized.']]);
        }

        // Dynamically resolve influencer user ID if a profile ID was passed
        $influencerUser = \App\Models\User::where('id', $influencerId)->where('role', 'influencer')->first();
        if (!$influencerUser) {
            $profile = \App\Models\InfluencerProfile::find($influencerId);
            if ($profile) {
                $influencerId = $profile->user_id;
            }
        }

        // Prevent duplicate requests
        $existing = CollaborationRequest::where('campaign_id', $campaignId)
            ->where('influencer_id', $influencerId)
            ->whereNotIn('status', ['rejected', 'cancelled'])
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'collaboration' => ['A collaboration request already exists for this influencer.'],
            ]);
        }

        return DB::transaction(function () use ($campaignId, $influencerId, $clientId, $data, $campaign) {
            $collab = CollaborationRequest::create([
                'campaign_id'     => $campaignId,
                'client_id'       => $clientId,
                'influencer_id'   => $influencerId,
                'status'          => 'pending',
                'proposed_amount' => $data['proposed_amount'] ?? null,
                'message'         => $data['message'] ?? null,
            ]);

            // Create negotiation record
            Negotiation::create([
                'collaboration_request_id' => $collab->id,
                'sender_id'               => $clientId,
                'type'                    => 'offer',
                'amount'                  => $data['proposed_amount'] ?? null,
                'message'                 => $data['message'] ?? null,
            ]);

            // Create conversation for this collaboration
            $conversation = $collab->conversation()->create([
                'collaboration_request_id' => $collab->id,
                'type'                    => 'campaign',
                'last_message_at'         => now(),
            ]);

            $conversation->participants()->attach([$clientId, $influencerId]);

            // Notify influencer
            SendNotificationJob::dispatch($influencerId, [
                'type'       => 'collaboration_request',
                'title'      => 'New Collaboration Request',
                'body'       => "You have a new collaboration request for: {$campaign->title}",
                'action_url' => "/collaborations/{$collab->id}",
                'data'       => ['collaboration_id' => $collab->id],
            ]);

            $influencer = User::find($influencerId);
            $client = User::find($clientId);
            if ($influencer && $client) {
                \Illuminate\Support\Facades\Mail::to($influencer->email)->send(new \App\Mail\CollaborationRequestMail(
                    $influencer->name,
                    $client->name,
                    $campaign->title,
                    (string)($data['proposed_amount'] ?? 0)
                ));
            }

            $this->logActivity($clientId, 'send_collaboration_request', 'collaboration_request', $collab->id);

            return $collab->load(['campaign', 'influencer', 'client']);
        });
    }

    public function respondToRequest(int $collabId, int $userId, string $action, array $data = []): CollaborationRequest
    {
        $collab = CollaborationRequest::with('campaign')->findOrFail($collabId);

        if ($collab->influencer_id !== $userId && $collab->client_id !== $userId) {
            throw ValidationException::withMessages(['collaboration' => ['Unauthorized.']]);
        }

        $isClient = $collab->client_id === $userId;
        $recipientId = $isClient ? $collab->influencer_id : $collab->client_id;

        return DB::transaction(function () use ($collab, $userId, $recipientId, $action, $data) {
            if ($action === 'accept') {
                $collab->update(['status' => 'negotiating']);
                Negotiation::create([
                    'collaboration_request_id' => $collab->id,
                    'sender_id'               => $userId,
                    'type'                    => 'accepted',
                    'amount'                  => $collab->proposed_amount,
                    'message'                 => $data['message'] ?? null,
                ]);
            } elseif ($action === 'counter') {
                $collab->update([
                    'status'          => 'negotiating',
                    'proposed_amount' => $data['amount'],
                ]);
                Negotiation::create([
                    'collaboration_request_id' => $collab->id,
                    'sender_id'               => $userId,
                    'type'                    => 'counter_offer',
                    'amount'                  => $data['amount'],
                    'message'                 => $data['message'] ?? null,
                ]);
            } elseif ($action === 'reject') {
                $collab->update(['status' => 'rejected']);
                Negotiation::create([
                    'collaboration_request_id' => $collab->id,
                    'sender_id'               => $userId,
                    'type'                    => 'rejected',
                    'message'                 => $data['message'] ?? null,
                ]);
            }

            // Notify the other party
            SendNotificationJob::dispatch($recipientId, [
                'type'       => 'collaboration_response',
                'title'      => "Collaboration {$action}ed",
                'body'       => "Your collaboration request was {$action}ed.",
                'action_url' => "/collaborations/{$collab->id}",
                'data'       => ['collaboration_id' => $collab->id],
            ]);

            return $collab->fresh();
        });
    }

    public function confirmDeal(int $collabId, int $userId, float $agreedAmount): CollaborationRequest
    {
        $collab = CollaborationRequest::findOrFail($collabId);

        if ($collab->client_id !== $userId && $collab->influencer_id !== $userId) {
            throw ValidationException::withMessages(['collaboration' => ['Unauthorized.']]);
        }

        return DB::transaction(function () use ($collab, $userId, $agreedAmount) {
            $update = [];
            if ($collab->client_id === $userId) {
                $update['client_confirmed_at'] = now();
            } else {
                $update['influencer_confirmed_at'] = now();
            }
            $update['agreed_amount'] = $agreedAmount;
            $collab->update($update);

            // Both confirmed → mark agreed
            if ($collab->fresh()->isBothConfirmed()) {
                $collab->update(['status' => 'agreed', 'agreed_at' => now()]);
                
                $client = User::find($collab->client_id);
                $influencer = User::find($collab->influencer_id);
                $campaignTitle = $collab->campaign->title ?? 'Campaign';
                
                if ($client && $influencer) {
                    \Illuminate\Support\Facades\Mail::to($client->email)->send(new \App\Mail\DealConfirmedMail(
                        $client->name, $influencer->name, $campaignTitle, (string)$agreedAmount
                    ));
                    \Illuminate\Support\Facades\Mail::to($influencer->email)->send(new \App\Mail\DealConfirmedMail(
                        $influencer->name, $client->name, $campaignTitle, (string)$agreedAmount
                    ));
                }
            }

            return $collab->fresh();
        });
    }

    private function logActivity(int $userId, string $action, string $entityType, int $entityId): void
    {
        ActivityLog::create([
            'user_id'     => $userId,
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'ip_address'  => request()->ip(),
        ]);
    }
}
