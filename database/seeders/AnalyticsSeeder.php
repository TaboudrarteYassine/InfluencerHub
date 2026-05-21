<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Campaign;
use App\Models\CollaborationRequest;
use App\Models\CampaignAnalytics;
use App\Models\Transaction;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        $influencers = User::where('role', 'influencer')->get();
        $clients = User::where('role', 'client')->get();

        if ($influencers->isEmpty() || $clients->isEmpty()) {
            $this->command->warn('⚠️ Seeding cancelled: No influencers or clients found. Seed them first.');
            return;
        }

        $client = $clients->first();

        // 6 months of history
        $months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

        foreach ($influencers as $influencer) {
            $baseAmount = $influencer->influencerProfile->price_min ?? 2000;

            foreach ($months as $index => $monthName) {
                // Determine a unique date in the past
                $subMonths = 5 - $index;
                $date = Carbon::now()->subMonths($subMonths)->startOfMonth()->addDays(15);

                // Create a mock campaign for this client
                $campaign = Campaign::create([
                    'client_id'           => $client->id,
                    'title'               => "Historical Campaign - " . $monthName . " (" . $influencer->name . ")",
                    'description'         => "Completed historical campaign for analytics tracking.",
                    'deliverables'        => "• Content styling and sharing.",
                    'platforms'           => ['instagram', 'tiktok'],
                    'budget_min'          => $baseAmount,
                    'budget_max'          => $baseAmount * 1.5,
                    'deadline'            => $date->copy()->subDays(5)->format('Y-m-d'),
                    'country'             => 'Morocco',
                    'status'              => 'active',
                ]);

                // Create Collaboration Request
                $collabAmount = $baseAmount + rand(-300, 800);
                $collab = CollaborationRequest::create([
                    'campaign_id'            => $campaign->id,
                    'client_id'              => $client->id,
                    'influencer_id'          => $influencer->id,
                    'status'                 => 'completed',
                    'proposed_amount'        => $collabAmount,
                    'agreed_amount'          => $collabAmount,
                    'client_confirmed_at'    => $date,
                    'influencer_confirmed_at'=> $date,
                    'agreed_at'              => $date->copy()->subDays(10),
                    'completed_at'           => $date,
                ]);

                // Create Transaction
                $commission = $collabAmount * 0.1;
                $influencerAmount = $collabAmount - $commission;
                Transaction::create([
                    'collaboration_request_id' => $collab->id,
                    'client_id'                => $client->id,
                    'influencer_id'            => $influencer->id,
                    'amount'                   => $collabAmount,
                    'platform_commission'      => $commission,
                    'influencer_amount'        => $influencerAmount,
                    'status'                   => 'released',
                    'paid_at'                  => $date->copy()->subDays(10),
                    'released_at'              => $date,
                ]);

                // Create Campaign Analytics
                $reach = rand(15000, 85000);
                $impressions = $reach * rand(12, 18) / 10;
                $likes = $reach * rand(5, 12) / 100;
                $comments = $likes * rand(2, 6) / 100;
                $shares = $likes * rand(1, 4) / 100;
                $clicks = $reach * rand(2, 5) / 100;

                $totalEngagement = $likes + $comments + $shares + $clicks;
                $engagementRate = ($totalEngagement / $reach) * 100;

                CampaignAnalytics::create([
                    'collaboration_request_id' => $collab->id,
                    'influencer_id'            => $influencer->id,
                    'campaign_id'              => $campaign->id,
                    'reach'                    => $reach,
                    'impressions'              => $impressions,
                    'likes'                    => $likes,
                    'comments'                 => $comments,
                    'shares'                   => $shares,
                    'clicks'                   => $clicks,
                    'engagement_rate'          => min($engagementRate, 25), // realistic cap
                    'roi_estimate'             => ($reach / 1000) * 20,
                    'post_url'                 => 'https://instagram.com/p/mock' . rand(100, 999),
                    'reported_at'              => $date,
                ]);
            }
        }

        $this->command->info('✅ Historical Campaign Analytics and Transactions seeded successfully for all influencers!');
    }
}
