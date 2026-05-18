<?php

namespace App\Services;

use App\Models\User;
use App\Models\ActivityLog;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Jobs\SendEmailVerificationJob;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AuthService
{
    private const MAX_ATTEMPTS  = 5;
    private const LOCKOUT_MINS  = 30;

    public function __construct(
        private readonly UserRepositoryInterface $userRepo
    ) {}

    /**
     * Register a new user and dispatch email verification.
     */
    public function register(array $data): array
    {
        $user = $this->userRepo->create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'phone'    => $data['phone'] ?? null,
        ]);

        // ── Assign Spatie role (required for middleware checks) ──────────
        $user->assignRole($data['role']);

        // Create empty profile based on role
        if ($user->isInfluencer()) {
            $user->influencerProfile()->create(['user_id' => $user->id]);
        } else {
            $user->clientProfile()->create(['user_id' => $user->id]);
        }

        // Send welcome and verification emails
        \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\WelcomeMail($user->name));
        $verifyUrl = url('/api/v1/auth/verify/' . $user->id . '/' . sha1($user->email)); // Placeholder verification URL
        \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\EmailVerificationMail($verifyUrl));

        // Log activity
        $this->logActivity($user->id, 'register', 'user', $user->id);

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    /**
     * Authenticate user with brute-force protection.
     */
    public function login(array $credentials, string $ip): array
    {
        $user = $this->userRepo->findByEmail($credentials['email']);

        // Check account existence
        if (!$user) {
            $this->recordFailedAttempt($credentials['email'], $ip);
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        // Check lockout
        if ($user->isLocked()) {
            throw ValidationException::withMessages([
                'email' => ['Account temporarily locked due to too many failed attempts. Try again later.'],
            ]);
        }

        // Check status
        if (!$user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]);
        }

        // Verify password
        if (!Hash::check($credentials['password'], $user->password)) {
            $this->recordFailedAttempt($credentials['email'], $ip);

            if ($user->failed_login_attempts + 1 >= self::MAX_ATTEMPTS) {
                $this->userRepo->lockAccount($credentials['email'], self::LOCKOUT_MINS);
                throw ValidationException::withMessages([
                    'email' => ['Too many failed attempts. Account locked for 30 minutes.'],
                ]);
            }
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        // Successful login
        $this->userRepo->updateLastLogin($user->id, $ip);
        $this->logActivity($user->id, 'login', 'user', $user->id, ['ip' => $ip]);

        // ── Auto-heal: ensure Spatie role is synced with role column ────
        if ($user->role && !$user->hasRole($user->role)) {
            $user->assignRole($user->role);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'  => $user->load(['influencerProfile', 'clientProfile']),
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
        $this->logActivity($user->id, 'logout', 'user', $user->id);
    }

    public function logoutAllDevices(User $user): void
    {
        $user->tokens()->delete();
        $this->logActivity($user->id, 'logout_all_devices', 'user', $user->id);
    }

    private function recordFailedAttempt(string $email, string $ip): void
    {
        $this->userRepo->incrementFailedAttempts($email);
    }

    private function logActivity(int $userId, string $action, string $entityType, int $entityId, array $metadata = []): void
    {
        ActivityLog::create([
            'user_id'     => $userId,
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'ip_address'  => request()->ip(),
            'user_agent'  => request()->userAgent(),
            'metadata'    => $metadata,
        ]);
    }
}
