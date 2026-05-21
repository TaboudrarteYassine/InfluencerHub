<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\InfluencerProfile;
use App\Models\SocialAccount;
use App\Models\ClientProfile;
use App\Models\Category;
use App\Models\Campaign;
use App\Models\Conversation;
use App\Models\Participant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
            CategorySeeder::class,
            SettingsSeeder::class,
            ClientSeeder::class,
            InfluencerSeeder::class,
            CampaignSeeder::class,
            AnalyticsSeeder::class,
        ]);
    }
}
