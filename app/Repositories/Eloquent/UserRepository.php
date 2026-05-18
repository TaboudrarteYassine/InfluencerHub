<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class UserRepository implements UserRepositoryInterface
{
    public function findById(int $id)
    {
        return Cache::remember("user:{$id}", 300, fn () => User::with(['influencerProfile', 'clientProfile'])->find($id));
    }

    public function findByEmail(string $email)
    {
        return User::where('email', $email)->first();
    }

    public function create(array $data)
    {
        return User::create($data);
    }

    public function update(int $id, array $data)
    {
        $user = User::findOrFail($id);
        $user->update($data);
        Cache::forget("user:{$id}");
        return $user->fresh();
    }

    public function incrementFailedAttempts(string $email): void
    {
        User::where('email', $email)->increment('failed_login_attempts');
    }

    public function resetFailedAttempts(int $userId): void
    {
        User::where('id', $userId)->update([
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);
        Cache::forget("user:{$userId}");
    }

    public function lockAccount(string $email, int $minutes = 30): void
    {
        User::where('email', $email)->update([
            'locked_until' => now()->addMinutes($minutes),
        ]);
    }

    public function updateLastLogin(int $userId, string $ip): void
    {
        User::where('id', $userId)->update([
            'last_login_at'         => now(),
            'last_login_ip'         => $ip,
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);
        Cache::forget("user:{$userId}");
    }
}
