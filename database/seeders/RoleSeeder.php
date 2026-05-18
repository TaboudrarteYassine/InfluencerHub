<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roles = ['admin', 'influencer', 'client'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create permissions
        $permissions = [
            // Campaigns
            'campaigns.create', 'campaigns.update', 'campaigns.delete',
            'campaigns.publish', 'campaigns.view-all',
            // Influencers
            'influencers.verify', 'influencers.view-all',
            // Users
            'users.manage', 'users.ban',
            // Reports
            'reports.manage',
            // Moderation
            'messages.moderate', 'content.moderate',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Assign permissions to admin
        $admin = Role::findByName('admin');
        $admin->givePermissionTo(Permission::all());

        // Assign permissions to client
        $client = Role::findByName('client');
        $client->givePermissionTo([
            'campaigns.create', 'campaigns.update',
            'campaigns.delete', 'campaigns.publish',
        ]);

        $this->command->info('✅ Roles & permissions seeded.');
    }
}
