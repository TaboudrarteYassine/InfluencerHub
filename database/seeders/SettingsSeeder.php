<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'platform_name', 'value' => 'InfluenceHub', 'type' => 'string'],
            ['key' => 'platform_tagline', 'value' => 'Connect. Collaborate. Grow.', 'type' => 'string'],
            ['key' => 'support_email', 'value' => 'support@influencehub.com', 'type' => 'string'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean'],
            ['key' => 'registration_open', 'value' => 'true', 'type' => 'boolean'],
            ['key' => 'ai_matching_enabled', 'value' => 'true', 'type' => 'boolean'],
            ['key' => 'ai_moderation_enabled', 'value' => 'true', 'type' => 'boolean'],
            ['key' => 'ai_pricing_enabled', 'value' => 'false', 'type' => 'boolean'],
            ['key' => 'ai_fake_detection_enabled', 'value' => 'false', 'type' => 'boolean'],
            ['key' => 'trust_verification_weight', 'value' => '30', 'type' => 'integer'],
            ['key' => 'trust_review_weight', 'value' => '25', 'type' => 'integer'],
            ['key' => 'trust_activity_weight', 'value' => '20', 'type' => 'integer'],
            ['key' => 'trust_engagement_weight', 'value' => '15', 'type' => 'integer'],
            ['key' => 'trust_response_weight', 'value' => '10', 'type' => 'integer'],
            ['key' => 'banned_keywords', 'value' => '', 'type' => 'string'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type'  => $setting['type'],
                ]
            );
        }

        $this->command->info('✅ Default settings seeded.');
    }
}
