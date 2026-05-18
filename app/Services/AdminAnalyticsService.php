<?php

namespace App\Services;

use App\Models\User;
use App\Models\Campaign;
use App\Models\InfluencerProfile;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    public function getChartsData()
    {
        $startDate = Carbon::now()->subDays(30);

        // User Growth
        $userGrowth = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();
            
        $userGrowthFormatted = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = Carbon::now()->subDays($i)->format('Y-m-d');
            $match = $userGrowth->firstWhere('date', $d);
            $userGrowthFormatted[] = [
                'name' => Carbon::parse($d)->format('M d'),
                'users' => $match ? (int)$match->count : 0
            ];
        }

        // Campaign Status
        $campaignStatusRaw = Campaign::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();
        $campaignStatus = $campaignStatusRaw->map(function($item) {
            return ['name' => ucfirst($item->status), 'value' => (int)$item->count];
        });

        // Top Influencers
        $topInfluencersRaw = InfluencerProfile::with('user:id,name')
            ->orderByDesc('trust_score')
            ->take(10)
            ->get();
        $topInfluencers = $topInfluencersRaw->map(function($item) {
            return ['name' => $item->user->name ?? 'Unknown', 'score' => (int)$item->trust_score];
        });

        // Top Niches
        $topCategoriesRaw = Category::withCount('campaigns')
            ->orderByDesc('campaigns_count')
            ->take(10)
            ->get();
        $topCategories = $topCategoriesRaw->map(function($item) {
            return ['name' => $item->name, 'count' => (int)$item->campaigns_count];
        });

        return [
            'userGrowth' => $userGrowthFormatted,
            'campaignStatus' => $campaignStatus,
            'topInfluencers' => $topInfluencers,
            'topCategories' => $topCategories,
        ];
    }
}
