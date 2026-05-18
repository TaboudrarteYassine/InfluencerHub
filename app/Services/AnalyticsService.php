<?php

namespace App\Services;

use App\Models\CampaignAnalytics;
use App\Models\CollaborationRequest;
use App\Models\Transaction;

class AnalyticsService
{
    public function submitAnalytics(int $collaborationId, array $data): CampaignAnalytics
    {
        $collab = CollaborationRequest::with('campaign')->findOrFail($collaborationId);
        
        if ($collab->influencer_id !== auth()->id()) {
            throw new \Exception('Unauthorized to submit analytics for this campaign.');
        }

        if ($collab->status !== 'completed') {
            throw new \Exception('Campaign must be completed before submitting analytics.');
        }

        $reach = $data['reach'] ?? 0;
        $impressions = $data['impressions'] ?? 0;
        $likes = $data['likes'] ?? 0;
        $comments = $data['comments'] ?? 0;
        $shares = $data['shares'] ?? 0;
        $clicks = $data['clicks'] ?? 0;

        $totalEngagement = $likes + $comments + $shares + $clicks;
        $engagementRate = $reach > 0 ? ($totalEngagement / $reach) * 100 : 0;
        
        // Example ROI estimate: assumed average CPM (Cost Per Mille) of 20 MAD
        $roiEstimate = ($reach / 1000) * 20;

        return CampaignAnalytics::updateOrCreate(
            [
                'collaboration_request_id' => $collaborationId,
                'influencer_id' => $collab->influencer_id,
                'campaign_id' => $collab->campaign_id,
            ],
            [
                'reach' => $reach,
                'impressions' => $impressions,
                'likes' => $likes,
                'comments' => $comments,
                'shares' => $shares,
                'clicks' => $clicks,
                'engagement_rate' => min($engagementRate, 100), // Cap at 100%
                'roi_estimate' => $roiEstimate,
                'post_url' => $data['post_url'] ?? null,
                'reported_at' => now(),
            ]
        );
    }

    public function getInfluencerStats(int $influencerId): array
    {
        $totalCampaigns = CollaborationRequest::where('influencer_id', $influencerId)
            ->where('status', 'completed')
            ->count();

        $analytics = CampaignAnalytics::where('influencer_id', $influencerId)->get();

        $totalReach = $analytics->sum('reach');
        $totalImpressions = $analytics->sum('impressions');
        $avgEngagement = $analytics->avg('engagement_rate') ?? 0;

        $totalEarnings = Transaction::where('influencer_id', $influencerId)
            ->where('status', 'released')
            ->sum('influencer_amount');

        $bestCampaign = CampaignAnalytics::with(['campaign', 'collaborationRequest.client'])
            ->where('influencer_id', $influencerId)
            ->orderByDesc('engagement_rate')
            ->first();

        // Monthly performance (last 6 months)
        $sixMonthsAgo = now()->subMonths(6);
        $monthlyData = CampaignAnalytics::where('influencer_id', $influencerId)
            ->where('reported_at', '>=', $sixMonthsAgo)
            ->get()
            ->groupBy(function($val) {
                return \Carbon\Carbon::parse($val->reported_at)->format('M');
            })->map(function($group) {
                return [
                    'reach' => $group->sum('reach'),
                    'impressions' => $group->sum('impressions'),
                    'engagement_rate' => $group->avg('engagement_rate'),
                ];
            });

        return [
            'total_campaigns' => $totalCampaigns,
            'total_reach' => $totalReach,
            'total_impressions' => $totalImpressions,
            'average_engagement_rate' => round($avgEngagement, 2),
            'total_earnings' => $totalEarnings,
            'best_campaign' => $bestCampaign,
            'monthly_performance' => $monthlyData,
            'completed_collaborations' => CollaborationRequest::with(['campaign', 'analytics', 'transaction'])
                ->where('influencer_id', $influencerId)
                ->where('status', 'completed')
                ->orderByDesc('updated_at')
                ->get(),
        ];
    }
}
