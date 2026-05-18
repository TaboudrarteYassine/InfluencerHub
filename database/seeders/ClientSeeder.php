<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ClientProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClientSeeder extends Seeder
{
    private array $clients = [
        [
            'name'         => 'Maroc Fashion Brand',
            'email'        => 'brand@marocfashion.com',
            'company_name' => 'Maroc Fashion',
            'description'  => 'Leading Moroccan fashion house offering premium traditional and modern clothing.',
            'industry'     => 'Fashion',
            'company_size' => '11-50',
            'website'      => 'https://marocfashion.com',
            'country'      => 'Morocco',
            'city'         => 'Casablanca',
        ],
        [
            'name'         => 'TechMa Solutions',
            'email'        => 'marketing@techma.ma',
            'company_name' => 'TechMa Solutions',
            'description'  => 'Moroccan SaaS company offering cloud solutions for businesses.',
            'industry'     => 'Technology',
            'company_size' => '51-200',
            'website'      => 'https://techma.ma',
            'country'      => 'Morocco',
            'city'         => 'Rabat',
        ],
        [
            'name'         => 'Cafe Atlas',
            'email'        => 'digital@cafeatlas.com',
            'company_name' => 'Cafe Atlas',
            'description'  => 'Premium Moroccan coffee brand with 30+ locations nationwide.',
            'industry'     => 'Food & Beverage',
            'company_size' => '51-200',
            'website'      => 'https://cafeatlas.ma',
            'country'      => 'Morocco',
            'city'         => 'Marrakech',
        ],
        [
            'name'         => 'Atlas Cosmetics',
            'email'        => 'contact@atlascosmetics.ma',
            'company_name' => 'Atlas Cosmetics',
            'description'  => 'Natural Moroccan beauty brand using argan oil and traditional ingredients.',
            'industry'     => 'Beauty',
            'company_size' => '1-10',
            'website'      => 'https://atlascosmetics.ma',
            'country'      => 'Morocco',
            'city'         => 'Fes',
        ],
    ];

    public function run(): void
    {
        foreach ($this->clients as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => Hash::make('Password@123'),
                    'role'              => 'client',
                    'status'            => 'active',
                    'email_verified_at' => now(),
                ]
            );

            $user->assignRole('client');

            ClientProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'company_name' => $data['company_name'],
                    'description'  => $data['description'],
                    'industry'     => $data['industry'],
                    'company_size' => $data['company_size'],
                    'website'      => $data['website'],
                    'country'      => $data['country'],
                    'city'         => $data['city'],
                ]
            );
        }

        $this->command->info('✅ ' . count($this->clients) . ' clients seeded with company profiles.');
    }
}
