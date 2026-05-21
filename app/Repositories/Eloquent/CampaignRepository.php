<?php

namespace App\Repositories\Eloquent;

use App\Models\Campaign;
use App\Repositories\Contracts\CampaignRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class CampaignRepository implements CampaignRepositoryInterface
{
    public function findById(int $id)
    {
        return Cache::remember("campaign:{$id}", 300, function () use ($id) {
            return Campaign::with([
                'client.clientProfile',
                'category',
                'collaborationRequests.negotiations',
                'collaborationRequests.conversation',
                'collaborationRequests.influencer',
            ])->findOrFail($id);
        });
    }

    public function create(array $data)
    {
        $campaign = Campaign::create($data);
        Cache::forget("campaigns:client:{$data['client_id']}");
        return $campaign;
    }

    public function update(int $id, array $data)
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->update($data);
        Cache::forget("campaign:{$id}");
        Cache::forget("campaigns:client:{$campaign->client_id}");
        return $campaign->fresh();
    }

    public function delete(int $id): void
    {
        $campaign = Campaign::findOrFail($id);
        Cache::forget("campaign:{$id}");
        Cache::forget("campaigns:client:{$campaign->client_id}");
        $campaign->delete();
    }

    public function listForClient(int $clientId, array $filters, int $perPage = 15)
    {
        return Campaign::where('client_id', $clientId)
            ->when(!empty($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function listPublished(array $filters, int $perPage = 15)
    {
        $query = Campaign::with(['client.clientProfile', 'category'])
            ->where('status', 'published');

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['budget_min'])) {
            $query->where('budget_max', '>=', $filters['budget_min']);
        }
        if (!empty($filters['budget_max'])) {
            $query->where('budget_min', '<=', $filters['budget_max']);
        }
        if (!empty($filters['platform'])) {
            $query->whereJsonContains('platforms', $filters['platform']);
        }
        if (!empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function updateStatus(int $id, string $status): void
    {
        Campaign::where('id', $id)->update(['status' => $status]);
        Cache::forget("campaign:{$id}");
    }
}
