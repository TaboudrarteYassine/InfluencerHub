<?php

namespace App\Services;

use App\Models\InfluencerProfile;
use App\Models\Review;
use App\Models\CollaborationRequest;
use App\Models\Report;
use App\Repositories\Contracts\InfluencerRepositoryInterface;
use Illuminate\Support\Facades\Log;

/**
 * Trust Score Engine
 *
 * Score breakdown (max 100):
 * - Verification status:    20 pts
 * - Avg rating:             25 pts
 * - Completed campaigns:    20 pts
 * - Engagement quality:     20 pts
 * - Response rate:           5 pts
 * - Reports penalty:        -10 pts max
 * - Platform activity:       10 pts
 */
class TrustScoreService
{
    private const WEIGHTS = [
        'verification'  => 20,
        'rating'        => 25,
        'campaigns'     => 20,
        'engagement'    => 20,
        'response'      => 5,
        'activity'      => 10,
        'report_penalty'=> 10,
    ];

    public function __construct(
        private readonly InfluencerRepositoryInterface $influencerRepo
    ) {}

    public function recalculate(int $profileId): float
    {
        $profile = InfluencerProfile::with([
            'socialAccounts',
            'user.reviewsReceived' => fn ($q) => $q->where('is_published', true),
            'user.collaborationRequestsAsInfluencer',
            'user',
        ])->findOrFail($profileId);

        $score = 0;

        // 1. Verification (20 pts)
        if ($profile->is_verified) {
            $score += self::WEIGHTS['verification'];
        }

        // 2. Rating score (25 pts)
        $score += $this->calculateRatingScore($profile);

        // 3. Completed campaigns (20 pts)
        $score += $this->calculateCampaignScore($profile);

        // 4. Engagement quality (20 pts) — checks fake follower score
        $score += $this->calculateEngagementScore($profile);

        // 5. Response rate (5 pts)
        $score += $this->calculateResponseScore($profile);

        // 6. Platform activity (10 pts)
        $score += $this->calculateActivityScore($profile);

        // 7. Reports penalty (up to -10 pts)
        $score -= $this->calculateReportPenalty($profile);

        $finalScore = max(0, min(100, round($score, 2)));

        $this->influencerRepo->updateTrustScore($profileId, $finalScore);

        // Update rating avg on profile too
        $ratings = $profile->user->reviewsReceived;
        if ($ratings->count() > 0) {
            $profile->update([
                'rating_avg'   => round($ratings->avg('rating'), 2),
                'rating_count' => $ratings->count(),
            ]);
        }

        Log::info("Trust score recalculated", [
            'profile_id' => $profileId,
            'score'      => $finalScore,
        ]);

        return $finalScore;
    }

    private function calculateRatingScore(InfluencerProfile $profile): float
    {
        $reviews = $profile->user->reviewsReceived;
        if ($reviews->isEmpty()) return 0;

        $avg = $reviews->avg('rating'); // 1–5
        return ($avg / 5) * self::WEIGHTS['rating'];
    }

    private function calculateCampaignScore(InfluencerProfile $profile): float
    {
        $completed = $profile->completed_campaigns;
        // Scale: 0=0pts, 5=10pts, 20+=20pts
        if ($completed === 0) return 0;
        if ($completed >= 20) return self::WEIGHTS['campaigns'];
        return ($completed / 20) * self::WEIGHTS['campaigns'];
    }

    private function calculateEngagementScore(InfluencerProfile $profile): float
    {
        $accounts = $profile->socialAccounts;
        if ($accounts->isEmpty()) return 0;

        // Average fake_follower_score across accounts (lower = better)
        $avgFakeScore = $accounts->avg('fake_follower_score');
        $engagementScore = (1 - ($avgFakeScore / 100)) * self::WEIGHTS['engagement'];

        // Also factor in avg engagement rate (industry avg ~3%)
        $avgEngagementRate = $accounts->avg('engagement_rate');
        $engagementBonus = min(1, $avgEngagementRate / 3) * (self::WEIGHTS['engagement'] * 0.3);

        return min(self::WEIGHTS['engagement'], $engagementScore + $engagementBonus);
    }

    private function calculateResponseScore(InfluencerProfile $profile): float
    {
        $hours = $profile->response_time_hours;
        if (is_null($hours)) return 0;

        // Under 2 hours = max, over 48 hours = 0
        if ($hours <= 2)  return self::WEIGHTS['response'];
        if ($hours >= 48) return 0;
        return ((48 - $hours) / 46) * self::WEIGHTS['response'];
    }

    private function calculateActivityScore(InfluencerProfile $profile): float
    {
        // Base activity on account age + profile completeness
        $completenessFields = [
            'bio', 'country', 'city', 'niches', 'price_min', 'price_max',
            'profile_picture', 'cover_image',
        ];

        $filled = collect($completenessFields)
            ->filter(fn ($field) => !empty($profile->$field))
            ->count();

        $completeness = $filled / count($completenessFields);
        $hasPortfolio = $profile->portfolioItems()->exists() ? 1 : 0;
        $hasSocial    = $profile->socialAccounts()->exists() ? 1 : 0;

        return (($completeness * 0.6) + ($hasPortfolio * 0.2) + ($hasSocial * 0.2)) * self::WEIGHTS['activity'];
    }

    private function calculateReportPenalty(InfluencerProfile $profile): float
    {
        $activeReports = Report::where('reportable_type', InfluencerProfile::class)
            ->where('reportable_id', $profile->id)
            ->where('status', 'actioned')
            ->count();

        return min(self::WEIGHTS['report_penalty'], $activeReports * 3);
    }
}
