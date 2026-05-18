<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Campaign;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        $clients = User::where('role', 'client')->get();

        if ($clients->isEmpty()) {
            $this->command->warn('⚠️  No clients found. Run ClientSeeder first.');
            return;
        }

        $fashionCat  = Category::where('slug', 'fashion')->first();
        $techCat     = Category::where('slug', 'technology')->first();
        $foodCat     = Category::where('slug', 'food')->first();
        $beautyCat   = Category::where('slug', 'beauty')->first();

        $campaigns = [
            [
                'client_email' => 'brand@marocfashion.com',
                'data' => [
                    'title'               => 'Summer Collection 2026 — Fashion Campaign',
                    'description'         => "We're launching our premium summer collection and looking for fashion influencers to showcase our new line. We need creators who can authentically present our traditional-meets-modern designs to their engaged audience.\n\nIdeal partner: Moroccan fashion creators with authentic styling content and 50K+ followers.",
                    'deliverables'        => "• 2 Instagram Reels featuring outfit styling\n• 3 Instagram Stories with swipe-up link\n• 1 TikTok video with styling tutorial\n• All content must use hashtag #MarocFashionSummer2026",
                    'category_id'         => $fashionCat?->id,
                    'platforms'           => ['instagram', 'tiktok'],
                    'budget_min'          => 3000,
                    'budget_max'          => 8000,
                    'deadline'            => now()->addDays(30)->format('Y-m-d'),
                    'country'             => 'Morocco',
                    'target_niches'       => ['Fashion', 'Lifestyle', 'Beauty'],
                    'min_followers'       => 50000,
                    'min_engagement_rate' => 3.0,
                    'status'              => 'published',
                ],
            ],
            [
                'client_email' => 'marketing@techma.ma',
                'data' => [
                    'title'               => 'TechMa SaaS Launch — B2B Creator Campaign',
                    'description'         => "TechMa is launching its new cloud ERP solution for Moroccan SMEs. We need tech and business influencers who can explain our product to decision-makers.\n\nLooking for creators with business/tech audience, ideally with LinkedIn presence.",
                    'deliverables'        => "• 1 YouTube review video (10+ minutes)\n• 2 LinkedIn posts with product insights\n• 1 Instagram post with key features\n• Honest, detailed product review",
                    'category_id'         => $techCat?->id,
                    'platforms'           => ['youtube', 'instagram'],
                    'budget_min'          => 8000,
                    'budget_max'          => 20000,
                    'deadline'            => now()->addDays(45)->format('Y-m-d'),
                    'country'             => 'Morocco',
                    'target_niches'       => ['Technology', 'Business', 'Education'],
                    'min_followers'       => 30000,
                    'min_engagement_rate' => 4.0,
                    'status'              => 'published',
                ],
            ],
            [
                'client_email' => 'digital@cafeatlas.com',
                'data' => [
                    'title'               => 'Cafe Atlas — New Ramadan Menu Launch',
                    'description'         => "We're launching our exclusive Ramadan menu featuring traditional Moroccan flavors with a premium twist. Looking for food & lifestyle creators to create atmosphere content.\n\nVisit any of our 30+ branches across Morocco. Full hospitality provided.",
                    'deliverables'        => "• 1 TikTok video of the dining experience\n• 2 Instagram posts with food photography\n• 4 Instagram Stories during visit\n• Tag @CafeAtlas and use #CafeAtlasRamadan",
                    'category_id'         => $foodCat?->id,
                    'platforms'           => ['tiktok', 'instagram'],
                    'budget_min'          => 1500,
                    'budget_max'          => 5000,
                    'deadline'            => now()->addDays(20)->format('Y-m-d'),
                    'country'             => 'Morocco',
                    'target_niches'       => ['Food', 'Lifestyle', 'Travel'],
                    'min_followers'       => 20000,
                    'min_engagement_rate' => 4.5,
                    'status'              => 'published',
                ],
            ],
            [
                'client_email' => 'contact@atlascosmetics.ma',
                'data' => [
                    'title'               => 'Atlas Argan Oil Collection — Beauty Review',
                    'description'         => "Atlas Cosmetics is sending our new Argan Oil skincare collection for honest review and promotion. We believe in transparency — share your real experience with our products.\n\nProducts will be shipped to your location.",
                    'deliverables'        => "• 1 Instagram Reel skincare routine video\n• Before/after content if applicable\n• 2 Instagram Stories with product showcase\n• Honest review and personal recommendation",
                    'category_id'         => $beautyCat?->id,
                    'platforms'           => ['instagram', 'tiktok'],
                    'budget_min'          => 800,
                    'budget_max'          => 3500,
                    'deadline'            => now()->addDays(35)->format('Y-m-d'),
                    'country'             => 'Morocco',
                    'target_niches'       => ['Beauty', 'Lifestyle', 'Health'],
                    'min_followers'       => 15000,
                    'min_engagement_rate' => 3.5,
                    'status'              => 'published',
                ],
            ],
            [
                'client_email' => 'brand@marocfashion.com',
                'data' => [
                    'title'               => 'Brand Ambassador Program 2026 — Draft',
                    'description'         => 'Ongoing ambassador program for our brand. Looking for a long-term partner who can represent Maroc Fashion throughout the year.',
                    'deliverables'        => 'Monthly content creation — to be negotiated.',
                    'category_id'         => $fashionCat?->id,
                    'platforms'           => ['instagram'],
                    'budget_min'          => 5000,
                    'budget_max'          => 25000,
                    'deadline'            => now()->addDays(90)->format('Y-m-d'),
                    'country'             => 'Morocco',
                    'target_niches'       => ['Fashion'],
                    'min_followers'       => 100000,
                    'min_engagement_rate' => 4.0,
                    'status'              => 'draft',
                ],
            ],
        ];

        foreach ($campaigns as $camp) {
            $client = $clients->firstWhere('email', $camp['client_email']);
            if (!$client) continue;

            Campaign::updateOrCreate(
                ['client_id' => $client->id, 'title' => $camp['data']['title']],
                array_merge($camp['data'], ['client_id' => $client->id])
            );
        }

        $this->command->info('✅ ' . count($campaigns) . ' campaigns seeded (4 published, 1 draft).');
    }
}
