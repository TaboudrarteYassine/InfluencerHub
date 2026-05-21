<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Fashion', 'icon' => '👗', 'color' => '#ec4899'],
            ['name' => 'Food & Drink', 'icon' => '🍽️', 'color' => '#f59e0b'],
            ['name' => 'Tech & Gadgets', 'icon' => '💻', 'color' => '#3b82f6'],
            ['name' => 'Travel', 'icon' => '✈️', 'color' => '#06b6d4'],
            ['name' => 'Fitness & Health', 'icon' => '💪', 'color' => '#10b981'],
            ['name' => 'Beauty & Skincare', 'icon' => '💄', 'color' => '#f97316'],
            ['name' => 'Automotive', 'icon' => '🚗', 'color' => '#64748b'],
            ['name' => 'Gaming', 'icon' => '🎮', 'color' => '#8b5cf6'],
            ['name' => 'Parenting', 'icon' => '👶', 'color' => '#f43f5e'],
            ['name' => 'Education', 'icon' => '📚', 'color' => '#14b8a6'],
            ['name' => 'Business & Finance', 'icon' => '💼', 'color' => '#6366f1'],
            ['name' => 'Entertainment', 'icon' => '🍿', 'color' => '#eab308'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'icon' => $cat['icon'],
                    'color' => $cat['color'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✅ ' . count($categories) . ' categories seeded.');
    }
}
