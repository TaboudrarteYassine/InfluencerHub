<?php

namespace App\Services;

use App\Models\Review;
use App\Models\Campaign;
use App\Models\User;
use App\Services\TrustScoreService;
use Illuminate\Pagination\LengthAwarePaginator;

class ReviewService
{
    public function __construct(private readonly TrustScoreService $trustScoreService) {}

    public function createReview(array $data, int $reviewerId): Review
    {
        $campaignId = $data['campaign_id'];
        $campaign = Campaign::findOrFail($campaignId);

        // Determine reviewee based on who is reviewing
        $revieweeId = null;
        if ($campaign->client->user_id === $reviewerId) {
            // Client is reviewing the influencer
            // Find the accepted collaboration request to get influencer_id
            $acceptedRequest = $campaign->collaborationRequests()->where('status', 'accepted')->first();
            if ($acceptedRequest) {
                $revieweeId = $acceptedRequest->influencer->user_id;
            }
        } else {
            // Influencer is reviewing the client
            $revieweeId = $campaign->client->user_id;
        }

        if (!$revieweeId) {
            throw new \Exception("Cannot determine reviewee.");
        }

        // Validate only one review per campaign per reviewer
        $existing = Review::where('campaign_id', $campaignId)
            ->where('reviewer_id', $reviewerId)
            ->exists();
            
        if ($existing) {
            throw new \Exception("You have already reviewed this campaign.");
        }

        $review = Review::create([
            'campaign_id' => $campaignId,
            'reviewer_id' => $reviewerId,
            'reviewee_id' => $revieweeId,
            'rating'      => $data['rating'],
            'comment'     => $data['comment'] ?? null,
            'is_visible'  => true,
            'is_flagged'  => false
        ]);

        // If the reviewee is an influencer, recalculate their trust score
        $reviewee = User::find($revieweeId);
        if ($reviewee && $reviewee->hasRole('influencer') && $reviewee->influencerProfile) {
            $this->trustScoreService->recalculate($reviewee->influencerProfile->id);
        }

        if ($reviewee) {
            $reviewer = User::find($reviewerId);
            $reviewerName = $reviewer ? $reviewer->name : 'Someone';
            \Illuminate\Support\Facades\Mail::to($reviewee->email)->send(new \App\Mail\ReviewReceivedMail(
                $reviewee->name,
                $reviewerName,
                (string)$data['rating'],
                $data['comment'] ?? 'No comment provided.'
            ));
        }

        return $review;
    }

    public function getInfluencerReviews(int $userId): LengthAwarePaginator
    {
        return Review::with(['reviewer:id,name,avatar'])
            ->where('reviewee_id', $userId)
            ->where('is_visible', true)
            ->orderByDesc('created_at')
            ->paginate(10);
    }

    public function getClientReviews(int $userId): LengthAwarePaginator
    {
        return Review::with(['reviewer:id,name,avatar'])
            ->where('reviewee_id', $userId)
            ->where('is_visible', true)
            ->orderByDesc('created_at')
            ->paginate(10);
    }

    public function canReview(int $campaignId, int $userId): bool
    {
        $campaign = Campaign::find($campaignId);
        if (!$campaign || $campaign->status !== 'completed') {
            return false;
        }

        $isParticipant = false;
        if ($campaign->client->user_id === $userId) {
            $isParticipant = true;
        } else {
            $acceptedRequest = $campaign->collaborationRequests()->where('status', 'accepted')->first();
            if ($acceptedRequest && $acceptedRequest->influencer->user_id === $userId) {
                $isParticipant = true;
            }
        }

        if (!$isParticipant) {
            return false;
        }

        $hasReviewed = Review::where('campaign_id', $campaignId)
            ->where('reviewer_id', $userId)
            ->exists();

        return !$hasReviewed;
    }
}
