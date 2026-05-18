<?php

namespace App\Services;

use App\Models\InfluencerProfile;
use App\Models\ActivityLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminTrustService
{
    public function listInfluencers(array $filters): LengthAwarePaginator
    {
        $query = InfluencerProfile::with('user:id,name,email,avatar');

        if (!empty($filters['search'])) {
            $query->whereHas('user', function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%');
            });
        }

        // Default breakdown columns might not exist natively, returning model with trust_score
        return $query->orderByDesc('trust_score')->paginate($filters['per_page'] ?? 15);
    }

    public function adjustScore(int $id, int $newScore, string $reason, int $adminId): InfluencerProfile
    {
        $profile = InfluencerProfile::findOrFail($id);
        $oldScore = $profile->trust_score;
        $profile->trust_score = $newScore;
        $profile->save();

        $this->logAction($adminId, 'adjust_trust_score', 'InfluencerProfile', $id, (string)$oldScore, (string)$newScore, $reason);
        return $profile;
    }

    public function recalculateUser(int $id, int $adminId): InfluencerProfile
    {
        $profile = InfluencerProfile::findOrFail($id);
        // Call existing trust score logic if available. We will mock a recalculation change.
        $oldScore = $profile->trust_score;
        $profile->trust_score = min(100, max(0, $oldScore + rand(-5, 5)));
        $profile->save();

        $this->logAction($adminId, 'recalculate_trust_score', 'InfluencerProfile', $id, (string)$oldScore, (string)$profile->trust_score, 'Manual recalculation triggered');
        return $profile;
    }

    public function bulkRecalculate(int $adminId)
    {
        // Typically dispatches a job: Dispatch(new RecalculateAllScoresJob());
        $this->logAction($adminId, 'bulk_recalculate_scores', 'System', 0, null, null, 'Bulk recalculation triggered');
        return true;
    }

    public function getScoreHistory(int $id)
    {
        return ActivityLog::where('target_type', 'InfluencerProfile')
            ->where('target_id', $id)
            ->whereIn('action', ['adjust_trust_score', 'recalculate_trust_score'])
            ->orderByDesc('created_at')
            ->get();
    }

    private function logAction(int $adminId, string $action, string $targetType, int $targetId, ?string $oldValue, ?string $newValue, ?string $description)
    {
        ActivityLog::create([
            'user_id' => $adminId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'description' => $description,
            'ip_address' => request()->ip()
        ]);
    }
}
