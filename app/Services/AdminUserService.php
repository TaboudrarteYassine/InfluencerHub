<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminUserService
{
    public function listUsers(array $filters): LengthAwarePaginator
    {
        $query = User::query()->with(['influencerProfile', 'clientProfile']);

        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%');
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    public function getUserDetails(int $id): User
    {
        return User::with(['influencerProfile.socialAccounts', 'clientProfile'])->findOrFail($id);
    }

    public function suspendUser(int $id): User
    {
        $user = User::findOrFail($id);
        $user->status = 'suspended';
        $user->save();
        return $user;
    }

    public function banUser(int $id): User
    {
        $user = User::findOrFail($id);
        $user->status = 'banned';
        $user->save();
        return $user;
    }

    public function unbanUser(int $id): User
    {
        $user = User::findOrFail($id);
        $user->status = 'active';
        $user->save();
        return $user;
    }

    public function verifyInfluencer(int $id): User
    {
        $user = User::findOrFail($id);
        if ($user->role === 'influencer' && $user->influencerProfile) {
            $user->influencerProfile->is_verified = true;
            $user->influencerProfile->save();
        }
        return $user;
    }

    public function rejectVerification(int $id): User
    {
        $user = User::findOrFail($id);
        if ($user->role === 'influencer' && $user->influencerProfile) {
            $user->influencerProfile->is_verified = false;
            $user->influencerProfile->save();
        }
        return $user;
    }
}
