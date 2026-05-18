<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@influencehub.com'],
            [
                'name'              => 'Super Admin',
                'password'          => Hash::make('Admin@12345'),
                'role'              => 'admin',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        $admin->assignRole('admin');

        $this->command->info("✅ Admin created — admin@influencehub.com / Admin\@12345");
    }
}
