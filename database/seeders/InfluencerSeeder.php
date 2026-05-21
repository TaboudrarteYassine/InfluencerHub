<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\InfluencerProfile;
use App\Models\SocialAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InfluencerSeeder extends Seeder
{
    private array $influencers = [
        [
            'name'         => 'Yasmine Benali',
            'email'        => 'yasmine@example.com',
            'display_name' => 'Yasmine B.',
            'bio'          => 'Moroccan fashion & lifestyle creator. Sharing my style journey from Casablanca to the world. Partner with me to reach authentic audiences.',
            'country'      => 'Morocco',
            'city'         => 'Casablanca',
            'niches'       => ['Fashion', 'Lifestyle', 'Beauty'],
            'languages'    => ['Arabic', 'French', 'English'],
            'price_min'    => 1500,
            'price_max'    => 8000,
            'trust_score'  => 87.5,
            'is_verified'  => true,
            'availability' => 'available',
            'socials' => [
                ['platform' => 'instagram', 'username' => 'yasmine_benali', 'followers_count' => 285000, 'engagement_rate' => 4.2],
                ['platform' => 'tiktok',    'username' => 'yasmineB',       'followers_count' => 142000, 'engagement_rate' => 6.8],
            ],
        ],
        [
            'name'         => 'Mehdi Tazi',
            'email'        => 'mehdi@example.com',
            'display_name' => 'Mehdi Tech',
            'bio'          => 'Tech reviewer & gadget enthusiast based in Rabat. I help Moroccan consumers make smart tech decisions.',
            'country'      => 'Morocco',
            'city'         => 'Rabat',
            'niches'       => ['Technology', 'Gaming', 'Business'],
            'languages'    => ['Arabic', 'French', 'Darija'],
            'price_min'    => 2000,
            'price_max'    => 12000,
            'trust_score'  => 92.0,
            'is_verified'  => true,
            'availability' => 'available',
            'socials' => [
                ['platform' => 'youtube',   'username' => 'MehdiTech',    'followers_count' => 520000, 'engagement_rate' => 5.1],
                ['platform' => 'instagram', 'username' => 'mehdi_tazi_',  'followers_count' => 89000,  'engagement_rate' => 3.7],
            ],
        ],
        [
            'name'         => 'Sara Alaoui',
            'email'        => 'sara@example.com',
            'display_name' => 'Sara Cuisine',
            'bio'          => 'Food & recipe creator sharing authentic Moroccan cuisine and fusion cooking. Marrakech-based, globally inspired.',
            'country'      => 'Morocco',
            'city'         => 'Marrakech',
            'niches'       => ['Food', 'Lifestyle', 'Travel'],
            'languages'    => ['Arabic', 'French'],
            'price_min'    => 800,
            'price_max'    => 4500,
            'trust_score'  => 78.3,
            'is_verified'  => true,
            'availability' => 'available',
            'socials' => [
                ['platform' => 'instagram', 'username' => 'sara_cuisine_ma', 'followers_count' => 173000, 'engagement_rate' => 5.9],
                ['platform' => 'tiktok',    'username' => 'sara_food',       'followers_count' => 95000,  'engagement_rate' => 8.2],
            ],
        ],
        [
            'name'         => 'Karim Idrissi',
            'email'        => 'karim@example.com',
            'display_name' => 'KarimFit',
            'bio'          => 'Fitness coach & bodybuilding influencer. Helping Moroccan youth build healthy habits through authentic content.',
            'country'      => 'Morocco',
            'city'         => 'Fes',
            'niches'       => ['Fitness', 'Health', 'Lifestyle'],
            'languages'    => ['Arabic', 'Darija', 'French'],
            'price_min'    => 600,
            'price_max'    => 3000,
            'trust_score'  => 71.5,
            'is_verified'  => false,
            'availability' => 'available',
            'socials' => [
                ['platform' => 'instagram', 'username' => 'karimfit_ma', 'followers_count' => 67000,  'engagement_rate' => 7.1],
                ['platform' => 'tiktok',    'username' => 'KarimFit',    'followers_count' => 210000, 'engagement_rate' => 9.4],
            ],
        ],
        [
            'name'         => 'Nadia Cherkaoui',
            'email'        => 'nadia@example.com',
            'display_name' => 'Nadia Travels',
            'bio'          => 'Travel & adventure creator exploring Morocco and the world. Authentic travel guides, hotel reviews, and hidden gems.',
            'country'      => 'Morocco',
            'city'         => 'Agadir',
            'niches'       => ['Travel', 'Lifestyle', 'Fashion'],
            'languages'    => ['Arabic', 'French', 'English', 'Spanish'],
            'price_min'    => 1200,
            'price_max'    => 7000,
            'trust_score'  => 83.7,
            'is_verified'  => true,
            'availability' => 'busy',
            'socials' => [
                ['platform' => 'instagram', 'username' => 'nadia_travels', 'followers_count' => 198000, 'engagement_rate' => 4.8],
                ['platform' => 'youtube',   'username' => 'NadiaTravels',  'followers_count' => 82000,  'engagement_rate' => 3.2],
            ],
        ],
        [
            'name'         => 'Amine Berrada',
            'email'        => 'amine@example.com',
            'display_name' => 'Amine Comedy',
            'bio'          => 'Comedian & content creator making viral Darija skits. Top Moroccan TikTok creator with 1M+ following.',
            'country'      => 'Morocco',
            'city'         => 'Casablanca',
            'niches'       => ['Comedy', 'Lifestyle', 'Music'],
            'languages'    => ['Darija', 'Arabic', 'French'],
            'price_min'    => 3000,
            'price_max'    => 15000,
            'trust_score'  => 94.1,
            'is_verified'  => true,
            'availability' => 'available',
            'socials' => [
                ['platform' => 'tiktok',    'username' => 'aminecomedy',    'followers_count' => 1100000, 'engagement_rate' => 11.2],
                ['platform' => 'instagram', 'username' => 'amine_berrada_', 'followers_count' => 340000,  'engagement_rate' => 5.6],
            ],
        ],
        [
            'name'         => 'Houda Moussaoui',
            'email'        => 'houda@example.com',
            'display_name' => 'Houda Beauty',
            'bio'          => 'Beauty & skincare expert. Makeup tutorials, product reviews, and honest recommendations for Moroccan skin types.',
            'country'      => 'Morocco',
            'city'         => 'Meknes',
            'niches'       => ['Beauty', 'Fashion', 'Lifestyle'],
            'languages'    => ['Arabic', 'French', 'Darija'],
            'price_min'    => 700,
            'price_max'    => 5000,
            'trust_score'  => 76.8,
            'is_verified'  => false,
            'availability' => 'available',
            'socials' => [
                ['platform' => 'instagram', 'username' => 'houda_beauty_ma', 'followers_count' => 125000, 'engagement_rate' => 6.3],
                ['platform' => 'youtube',   'username' => 'HoudaBeauty',     'followers_count' => 43000,  'engagement_rate' => 4.1],
            ],
        ],
        [
            'name'         => 'Youssef Lamrani',
            'email'        => 'youssef@example.com',
            'display_name' => 'Youssef Business',
            'bio'          => 'Entrepreneur & business coach. Helping Moroccan startups grow with digital marketing and branding insights.',
            'country'      => 'Morocco',
            'city'         => 'Casablanca',
            'niches'       => ['Business', 'Education', 'Technology'],
            'languages'    => ['Arabic', 'French', 'English'],
            'price_min'    => 2500,
            'price_max'    => 18000,
            'trust_score'  => 88.9,
            'is_verified'  => true,
            'availability' => 'available',
            'socials' => [
                ['platform' => 'twitter',   'username' => 'youssef_lamrani', 'followers_count' => 58000,  'engagement_rate' => 8.7],
                ['platform' => 'instagram', 'username' => 'youssef_biz',     'followers_count' => 92000,  'engagement_rate' => 4.5],
            ],
        ],
    ];

    public function run(): void
    {
        foreach ($this->influencers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => \Illuminate\Support\Facades\Hash::make('Password@123'),
                    'role'              => 'influencer',
                    'status'            => 'active',
                    'email_verified_at' => now(),
                ]
            );

            $user->assignRole('influencer');

            $profile = InfluencerProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'display_name' => $data['display_name'],
                    'bio'          => $data['bio'],
                    'country'      => $data['country'],
                    'city'         => $data['city'],
                    'niches'       => $data['niches'],
                    'languages'    => $data['languages'],
                    'price_min'    => $data['price_min'],
                    'price_max'    => $data['price_max'],
                    'trust_score'  => $data['trust_score'],
                    'is_verified'  => $data['is_verified'],
                    'availability' => $data['availability'],
                    'verification_status' => 'approved',
                ]
            );

            foreach ($data['socials'] as $social) {
                SocialAccount::updateOrCreate(
                    ['influencer_profile_id' => $profile->id, 'platform' => $social['platform']],
                    [
                        'username'        => $social['username'],
                        'followers_count' => $social['followers_count'],
                        'engagement_rate' => $social['engagement_rate'],
                        'is_verified'     => $data['is_verified'],
                    ]
                );
            }
        }

        $this->command->info('✅ ' . count($this->influencers) . ' influencers seeded with social accounts.');
    }
}
