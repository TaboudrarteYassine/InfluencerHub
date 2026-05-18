<?php

namespace App\Services;

use App\Models\User;
use App\Models\Campaign;
use App\Models\InfluencerProfile;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminStatsService
{
    public function getDashboardStats(): array
    {
        $now = Carbon::now();
        $startOfWeek = clone $now;
        $startOfWeek->startOfWeek();
        $endOfWeek = clone $now;
        $endOfWeek->endOfWeek();

        return [
            'total_users' => User::whereIn('role', ['influencer', 'client'])->count(),
            'total_influencers' => User::where('role', 'influencer')->count(),
            'total_clients' => User::where('role', 'client')->count(),
            'registrations' => [
                'today' => User::whereDate('created_at', Carbon::today())->count(),
                'this_week' => User::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count(),
                'this_month' => User::whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->count(),
            ],
            'campaigns' => [
                'total' => Campaign::count(),
                'active' => Campaign::where('status', 'active')->count(),
                'completed' => Campaign::where('status', 'completed')->count(),
                'cancelled' => Campaign::where('status', 'cancelled')->count(),
            ],
            'pending_verifications' => InfluencerProfile::where('verification_status', 'pending')->count(),
            'open_reports' => 0, // Placeholder as requested
            'top_influencers' => InfluencerProfile::with('user:id,name,avatar')
                ->orderByDesc('trust_score')
                ->take(5)
                ->get(),
            'user_growth' => $this->getUserGrowthData(),
        ];
    }

    private function getUserGrowthData(): array
    {
        $startDate = Carbon::now()->subDays(30);

        // Group by date
        $growth = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        $labels = [];
        $data = [];

        // Fill missing days
        for ($i = 0; $i < 30; $i++) {
            $date = Carbon::now()->subDays(29 - $i)->format('Y-m-d');
            $labels[] = Carbon::parse($date)->format('M d');
            
            $dayData = $growth->firstWhere('date', $date);
            $data[] = $dayData ? $dayData->count : 0;
        }

        return [
            'labels' => $labels,
            'data' => $data,
        ];
    }
}
