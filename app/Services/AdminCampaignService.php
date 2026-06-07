<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\ActivityLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminCampaignService
{
    public function listCampaigns(array $filters): LengthAwarePaginator
    {
        $query = Campaign::with(['client:id,name', 'category:id,name']);

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['platform']) && $filters['platform'] !== 'all') {
            // platforms is a JSON column stored as an array
            $query->whereJsonContains('platforms', $filters['platform']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhereHas('client', fn ($cq) => $cq->where('name', 'like', $search));
            });
        }

        return $query->orderByDesc('created_at')->paginate($filters['per_page'] ?? 15);
    }

    public function getCampaignDetails(int $id): Campaign
    {
        return Campaign::with([
            'client',
            'category',
            'collaborationRequests.influencer',
            'collaborationRequests.negotiations'
        ])->findOrFail($id);
    }

    public function forceCancel(int $id, string $reason, int $adminId): Campaign
    {
        $campaign = Campaign::findOrFail($id);
        $oldStatus = $campaign->status;
        $campaign->status = 'cancelled';
        $campaign->save();

        $this->logAction($adminId, 'force_cancel_campaign', 'Campaign', $id, $oldStatus, 'cancelled', $reason);
        return $campaign;
    }

    public function markCompleted(int $id, string $reason, int $adminId): Campaign
    {
        $campaign = Campaign::findOrFail($id);
        $oldStatus = $campaign->status;
        $campaign->status = 'completed';
        $campaign->save();

        $this->logAction($adminId, 'mark_completed_campaign', 'Campaign', $id, $oldStatus, 'completed', $reason);
        return $campaign;
    }

    public function addNote(int $id, string $note, int $adminId): Campaign
    {
        $campaign = Campaign::findOrFail($id);
        $this->logAction($adminId, 'add_campaign_note', 'Campaign', $id, null, null, $note);
        return $campaign;
    }

    public function flagSuspicious(int $id, string $reason, int $adminId): Campaign
    {
        $campaign = Campaign::findOrFail($id);
        // Assuming there is an is_flagged column or we just change status to suspended
        // For now, we will add a note and change status if there isn't a flag column
        $oldStatus = $campaign->status;
        $campaign->status = 'suspended'; // Let's use suspended for flagged
        $campaign->save();

        $this->logAction($adminId, 'flag_campaign_suspicious', 'Campaign', $id, $oldStatus, 'suspended', $reason);
        return $campaign;
    }

    private function logAction(int $adminId, string $action, string $entityType, int $entityId, ?string $oldValue, ?string $newValue, ?string $description)
    {
        ActivityLog::create([
            'user_id' => $adminId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValue,
            'new_values' => $newValue,
            'description' => $description,
            'ip_address' => request()->ip()
        ]);
    }
}
