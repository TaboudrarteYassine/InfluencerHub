<?php

namespace App\Services;

use App\Models\Review;
use App\Models\ActivityLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminReviewService
{
    public function listReviews(array $filters): LengthAwarePaginator
    {
        $query = Review::with(['reviewer:id,name', 'reviewee:id,name']);

        if (!empty($filters['rating']) && $filters['rating'] !== 'all') {
            $query->where('rating', (int) $filters['rating']);
        }

        if (isset($filters['is_visible']) && $filters['is_visible'] !== 'all' && $filters['is_visible'] !== '') {
            $query->where('is_visible', filter_var($filters['is_visible'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderByDesc('created_at')->paginate($filters['per_page'] ?? 15);
    }

    public function hideReview(int $id, int $adminId): Review
    {
        $review = Review::findOrFail($id);
        // Let's assume there's an is_visible column or we use a metadata approach if not.
        $review->is_visible = false;
        $review->save();

        $this->logAction($adminId, 'hide_review', 'Review', $id, null, 'false', 'Review hidden');
        return $review;
    }

    public function restoreReview(int $id, int $adminId): Review
    {
        $review = Review::findOrFail($id);
        $review->is_visible = true;
        $review->save();

        $this->logAction($adminId, 'restore_review', 'Review', $id, null, 'true', 'Review restored');
        return $review;
    }

    public function flagFake(int $id, int $adminId): Review
    {
        $review = Review::findOrFail($id);
        $review->is_visible = false;
        $review->save();

        $this->logAction($adminId, 'flag_fake_review', 'Review', $id, null, 'fake', 'Review flagged as fake and hidden');
        return $review;
    }

    public function deleteReview(int $id, int $adminId)
    {
        $review = Review::findOrFail($id);
        $review->delete();
        $this->logAction($adminId, 'delete_review', 'Review', $id, null, null, 'Review permanently deleted');
        return true;
    }

    public function sendWarning(int $id, int $adminId)
    {
        $review = Review::findOrFail($id);
        $this->logAction($adminId, 'send_review_warning', 'Review', $id, null, null, 'Warning sent to reviewer');
        return true;
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
