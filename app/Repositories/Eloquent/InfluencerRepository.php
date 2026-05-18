<?php

namespace App\Repositories\Eloquent;

use App\Models\InfluencerProfile;
use App\Repositories\Contracts\InfluencerRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class InfluencerRepository implements InfluencerRepositoryInterface
{
    public function findByUserId(int $userId)
    {
        return Cache::remember("influencer:user:{$userId}", 300, function () use ($userId) {
            return InfluencerProfile::with(['user', 'socialAccounts', 'portfolioItems'])
                ->where('user_id', $userId)
                ->first();
        });
    }

    public function findById(int $userId)
    {
        return Cache::remember("influencer:user:{$userId}", 300, function () use ($userId) {
            return InfluencerProfile::with(['user', 'socialAccounts', 'portfolioItems'])
                ->where('user_id', $userId)
                ->firstOrFail();
        });
    }

    public function createOrUpdate(int $userId, array $data)
    {
        $profile = InfluencerProfile::updateOrCreate(['user_id' => $userId], $data);
        Cache::forget("influencer:user:{$userId}");
        Cache::forget("influencer:{$profile->id}");
        return $profile;
    }

    public function search(array $filters, int $perPage = 18)
    {
        $query = InfluencerProfile::with(['user', 'socialAccounts'])
            ->whereHas('user', fn ($q) => $q->where('status', 'active'));

        // Full-text search across name and bio
        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->whereHas('user', fn ($uq) => $uq->where('name', 'like', $term))
                  ->orWhere('bio', 'like', $term)
                  ->orWhere('display_name', 'like', $term)
                  ->orWhere('city', 'like', $term);
            });
        }

        if (!empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }
        if (!empty($filters['city'])) {
            $query->where('city', 'like', '%' . $filters['city'] . '%');
        }
        if (!empty($filters['availability'])) {
            $query->where('availability', $filters['availability']);
        }
        if (!empty($filters['is_verified'])) {
            $query->where('is_verified', true);
        }
        if (!empty($filters['price_min'])) {
            $query->where('price_max', '>=', $filters['price_min']);
        }
        if (!empty($filters['price_max'])) {
            $query->where('price_min', '<=', $filters['price_max']);
        }
        if (!empty($filters['trust_score_min'])) {
            $query->where('trust_score', '>=', $filters['trust_score_min']);
        }

        // Single niche (from frontend dropdown)
        if (!empty($filters['niche'])) {
            $query->whereJsonContains('niches', $filters['niche']);
        }

        // Array of niches (from API usage)
        if (!empty($filters['niches']) && is_array($filters['niches'])) {
            foreach ($filters['niches'] as $niche) {
                $query->whereJsonContains('niches', $niche);
            }
        }

        if (!empty($filters['platform'])) {
            $query->whereHas('socialAccounts', fn ($q) => $q->where('platform', $filters['platform']));
        }
        if (!empty($filters['followers_min'])) {
            $query->whereHas('socialAccounts', fn ($q) => $q->where('followers_count', '>=', $filters['followers_min']));
        }
        if (!empty($filters['engagement_min'])) {
            $query->whereHas('socialAccounts', fn ($q) => $q->where('engagement_rate', '>=', $filters['engagement_min']));
        }

        $sortField = $filters['sort'] ?? 'trust_score';
        $sortDir   = $filters['direction'] ?? 'desc';
        $allowedSorts = ['trust_score', 'rating_avg', 'completed_campaigns', 'price_min', 'created_at'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir);
        } else {
            $query->orderBy('trust_score', 'desc');
        }

        return $query->paginate($perPage);
    }

    public function updateTrustScore(int $profileId, float $score): void
    {
        InfluencerProfile::where('id', $profileId)->update(['trust_score' => $score]);
        Cache::forget("influencer:{$profileId}");
    }

    public function getFeatured(int $limit = 10): array
    {
        return Cache::remember("influencers:featured:{$limit}", 600, function () use ($limit) {
            return InfluencerProfile::with(['user', 'socialAccounts'])
                ->where('is_verified', true)
                ->where('availability', 'available')
                ->orderBy('trust_score', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
        });
    }
}
