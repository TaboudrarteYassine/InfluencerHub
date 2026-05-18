<?php

namespace App\Services;

use App\Models\InfluencerProfile;
use App\Models\ActivityLog;
use App\Repositories\Contracts\InfluencerRepositoryInterface;
use App\Jobs\RecalculateTrustScoreJob;
use Illuminate\Support\Facades\Storage;

class InfluencerService
{
    public function __construct(
        private readonly InfluencerRepositoryInterface $influencerRepo
    ) {}

    public function getProfile(int $userId)
    {
        return $this->influencerRepo->findByUserId($userId);
    }

    public function updateProfile(int $userId, array $data): InfluencerProfile
    {
        // Handle file uploads
        if (!empty($data['profile_picture_file'])) {
            $path = $data['profile_picture_file']->store("profiles/{$userId}", 'public');
            $data['profile_picture'] = $path;
            unset($data['profile_picture_file']);
        }
        if (!empty($data['cover_image_file'])) {
            $path = $data['cover_image_file']->store("covers/{$userId}", 'public');
            $data['cover_image'] = $path;
            unset($data['cover_image_file']);
        }

        $profile = $this->influencerRepo->createOrUpdate($userId, $data);

        $this->logActivity($userId, 'update_profile', 'influencer_profile', $profile->id, $data);

        return $profile;
    }

    public function addSocialAccount(int $userId, array $data): \App\Models\SocialAccount
    {
        $profile = $this->influencerRepo->findByUserId($userId);

        $account = $profile->socialAccounts()->updateOrCreate(
            ['platform' => $data['platform']],
            $data
        );

        // Dispatch trust score recalculation
        RecalculateTrustScoreJob::dispatch($profile->id);

        return $account;
    }

    public function search(array $filters, int $perPage = 20)
    {
        return $this->influencerRepo->search($filters, $perPage);
    }

    public function getFeatured(int $limit = 10): array
    {
        return $this->influencerRepo->getFeatured($limit);
    }

    private function logActivity(int $userId, string $action, string $entityType, int $entityId, array $data = []): void
    {
        ActivityLog::create([
            'user_id'     => $userId,
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'ip_address'  => request()->ip(),
        ]);
    }
}
