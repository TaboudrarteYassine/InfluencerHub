<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CampaignService;
use App\Services\AiMatchingService;
use App\Http\Requests\Campaign\CreateCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Http\Requests\Campaign\CollaborationRequest as CollabRequest;
use App\Repositories\Contracts\CampaignRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function __construct(
        private readonly CampaignService              $campaignService,
        private readonly CampaignRepositoryInterface  $campaignRepo,
        private readonly AiMatchingService            $aiMatchingService,
    ) {}

    // ─── Public ─────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $campaigns = $this->campaignRepo->listPublished($request->only([
            'category_id', 'budget_min', 'budget_max', 'platform', 'country',
        ]), $request->get('per_page', 15));

        return response()->json(['success' => true, 'data' => $campaigns]);
    }

    public function show(int $id): JsonResponse
    {
        $campaign = $this->campaignRepo->findById($id);
        return response()->json(['success' => true, 'data' => ['campaign' => $campaign]]);
    }

    public function publicCampaigns(Request $request): JsonResponse
    {
        // Public campaigns visible to influencers
        $query = \App\Models\Campaign::with(['clientProfile.user'])
            ->where('status', 'published')
            ->latest();

        // Search by title or brand name
        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                  ->orWhere('description', 'like', $term)
                  ->orWhereHas('clientProfile', fn ($cq) => $cq->where('company_name', 'like', $term));
            });
        }

        // Optional filters
        if ($request->filled('platform')) {
            $query->whereJsonContains('platforms', $request->platform);
        }
        if ($request->filled('niche')) {
            $query->whereJsonContains('target_niches', $request->niche);
        }
        if ($request->filled('budget_min')) {
            $query->where('budget_min', '>=', $request->budget_min);
        }
        if ($request->filled('sort')) {
            $query->reorder($request->sort === 'budget_min' ? 'budget_min' : 'created_at', 'desc');
        }

        // Exclude campaigns where auth user already applied (if authenticated)
        if ($user = auth('sanctum')->user()) {
            if ($user->hasRole('influencer')) {
                $query->whereDoesntHave('collaborationRequests', function ($q) use ($user) {
                    $q->where('influencer_id', $user->id);
                });
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($request->get('per_page', 12))
        ]);
    }

    // ─── Client actions ──────────────────────────────────────────────
    public function store(CreateCampaignRequest $request): JsonResponse
    {
        $campaign = $this->campaignService->create($request->user()->id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Campaign created.',
            'data'    => ['campaign' => $campaign],
        ], 201);
    }

    public function update(UpdateCampaignRequest $request, int $id): JsonResponse
    {
        $campaign = $this->campaignService->update($id, $request->user()->id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Campaign updated.',
            'data'    => ['campaign' => $campaign],
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->campaignService->delete($id, $request->user()->id);
        return response()->json(['success' => true, 'message' => 'Campaign deleted.']);
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        $campaign = $this->campaignService->publish($id, $request->user()->id);
        return response()->json(['success' => true, 'message' => 'Campaign published.', 'data' => ['campaign' => $campaign]]);
    }

    public function markCompleted(Request $request, int $id): JsonResponse
    {
        $campaign = $this->campaignRepo->findById($id);
        if ($campaign->client_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }
        $this->campaignRepo->updateStatus($id, 'completed');
        $campaign->collaborationRequests()->where('status', 'accepted')->update(['status' => 'completed']);
        return response()->json(['success' => true, 'message' => 'Campaign marked as completed.']);
    }

    public function myCampaigns(Request $request): JsonResponse
    {
        $campaigns = $this->campaignRepo->listForClient(
            $request->user()->id,
            $request->only('status'),
            $request->get('per_page', 15)
        );
        return response()->json(['success' => true, 'data' => $campaigns]);
    }

    public function sendRequest(CollabRequest $request, int $campaignId): JsonResponse
    {
        $collab = $this->campaignService->sendCollaborationRequest(
            $campaignId,
            $request->validated('influencer_id'),
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Collaboration request sent.',
            'data'    => ['collaboration' => $collab],
        ], 201);
    }

    public function aiMatches(Request $request, int $campaignId): JsonResponse
    {
        $campaign = $this->campaignRepo->findById($campaignId);

        if ($campaign->client_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $matches = $this->aiMatchingService->matchInfluencersForCampaign($campaign, 10);

        return response()->json([
            'success' => true,
            'data'    => ['matches' => $matches],
        ]);
    }

    // ─── Shared Actions (Client/Influencer) ──────────────────────────
    public function respondToRequest(Request $request, int $requestId): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:accept,reject,counter',
            'amount' => 'required_if:action,counter|numeric|min:0',
            'message'=> 'nullable|string'
        ]);

        // Assuming influencer responding
        $collab = $this->campaignService->respondToRequest(
            $requestId,
            $request->user()->id,
            $request->action,
            $request->only(['amount', 'message'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Response recorded.',
            'data'    => ['collaboration' => $collab]
        ]);
    }

    public function confirmDeal(Request $request, int $requestId): JsonResponse
    {
        $request->validate(['agreed_amount' => 'required|numeric|min:0']);

        $collab = $this->campaignService->confirmDeal(
            $requestId,
            $request->user()->id,
            $request->agreed_amount
        );

        return response()->json([
            'success' => true,
            'message' => 'Deal confirmed.',
            'data'    => ['collaboration' => $collab]
        ]);
    }

    public function applyToCampaign(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'proposed_amount' => 'required|numeric|min:0',
            'message'         => 'required|string',
        ]);

        $campaign = $this->campaignRepo->findById($id);

        if ($campaign->status !== 'published') {
            return response()->json(['success' => false, 'message' => 'Campaign is not open for applications.'], 400);
        }

        $influencerId = $request->user()->id;

        // Uses slightly different logic than sending a request to the influencer:
        // Here, the influencer initiates it towards the client.
        
        $existing = \App\Models\CollaborationRequest::where('campaign_id', $id)
            ->where('influencer_id', $influencerId)
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Already applied.'], 400);
        }

        $collab = \Illuminate\Support\Facades\DB::transaction(function () use ($campaign, $influencerId, $request) {
            $collab = \App\Models\CollaborationRequest::create([
                'campaign_id'     => $campaign->id,
                'client_id'       => $campaign->client_id,
                'influencer_id'   => $influencerId,
                'status'          => 'pending',
                'proposed_amount' => $request->proposed_amount,
                'message'         => $request->message,
            ]);

            \App\Models\Negotiation::create([
                'collaboration_request_id' => $collab->id,
                'sender_id'               => $influencerId,
                'type'                    => 'offer',
                'amount'                  => $request->proposed_amount,
                'message'                 => $request->message,
            ]);

            $conversation = $collab->conversation()->create([
                'collaboration_request_id' => $collab->id,
                'type'                    => 'campaign',
                'last_message_at'         => now(),
            ]);

            $conversation->participants()->attach([$campaign->client_id, $influencerId]);

            $client = \App\Models\User::find($campaign->client_id);
            $influencer = \App\Models\User::find($influencerId);
            if ($client && $influencer) {
                \Illuminate\Support\Facades\Mail::to($client->email)->send(new \App\Mail\CollaborationRequestMail(
                    $client->name,
                    $influencer->name,
                    $campaign->title,
                    (string)$request->proposed_amount
                ));
            }

            // Notify client
            \App\Jobs\SendNotificationJob::dispatch($campaign->client_id, [
                'type'       => 'collaboration_request',
                'title'      => 'New Campaign Application',
                'body'       => "An influencer applied to your campaign: {$campaign->title}",
                'action_url' => "/campaigns/{$campaign->id}",
                'data'       => ['collaboration_id' => $collab->id],
            ]);

            return $collab;
        });

        return response()->json([
            'success' => true,
            'message' => 'Application sent.',
            'data'    => ['collaboration' => $collab],
        ], 201);
    }
}
