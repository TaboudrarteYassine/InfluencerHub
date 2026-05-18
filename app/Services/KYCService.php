<?php

namespace App\Services;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Jobs\SendEmailVerificationJob; // Just using as placeholder for emails for now
use App\Services\MediaService;

class KYCService
{
    protected $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

    /**
     * Submit KYC documents for an influencer
     */
    public function submitKYC(User $user, array $data): void
    {
        $profile = $user->influencerProfile;
        
        if (!$profile) {
            throw new \Exception("Influencer profile not found.");
        }

        // Generate unique username from full name if not provided
        $username = $data['username'] ?? $this->generateUsernameSlug($data['full_name']);

        // Update User
        $user->update([
            'full_name' => $data['full_name'],
            'phone_number' => $data['phone_number'],
            'username' => $username,
        ]);

        // Store files using MediaService
        $cinPath = $this->mediaService->uploadKYC($data['cin_front'], $user->id, 'cin_front');
        $selfiePath = $this->mediaService->uploadKYC($data['selfie'], $user->id, 'selfie');

        $profile->update([
            'cin_front_url' => $cinPath,
            'selfie_url' => $selfiePath,
            'verification_status' => 'pending',
            'submitted_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'kyc_submitted',
            'description' => "User submitted KYC documents.",
            'ip_address' => request()->ip(),
        ]);

        // Send Email notification
        \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\KYCSubmittedMail($user->name));
    }

    /**
     * Approve KYC
     */
    public function approveKYC(User $user, User $admin): void
    {
        $profile = $user->influencerProfile;

        $profile->update([
            'verification_status' => 'approved',
            'verified_at' => now(),
            'is_verified' => true,
        ]);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'kyc_approved',
            'description' => "Admin approved KYC for user {$user->id}.",
            'ip_address' => request()->ip(),
        ]);

        \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\KYCApprovedMail($user->name));
    }

    /**
     * Reject KYC
     */
    public function rejectKYC(User $user, string $reason, User $admin): void
    {
        $profile = $user->influencerProfile;

        $profile->update([
            'verification_status' => 'rejected',
            'verification_note' => $reason,
        ]);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'kyc_rejected',
            'description' => "Admin rejected KYC for user {$user->id}. Reason: {$reason}",
            'ip_address' => request()->ip(),
        ]);

        \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\KYCRejectedMail($user->name, $reason));
    }

    /**
     * Auto-generate unique username from full name
     */
    public function generateUsernameSlug(string $fullName): string
    {
        $slug = Str::slug($fullName, '.');
        $originalSlug = $slug;
        $counter = 2;

        while (User::where('username', $slug)->exists()) {
            $slug = "{$originalSlug}{$counter}";
            $counter++;
        }

        return $slug;
    }
}
