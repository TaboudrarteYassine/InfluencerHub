<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SavedInfluencer;
use App\Models\InfluencerProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SavedController extends Controller
{
    /**
     * POST /api/v1/saved/{influencerId}
     * Toggle save/unsave for a client.
     */
    public function toggle(Request $request, int $influencerId): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Only clients can save influencers.'], 403);
        }

        $existing = SavedInfluencer::where('client_id', $user->id)
            ->where('influencer_id', $influencerId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['status' => 'success', 'data' => ['saved' => false]]);
        }

        SavedInfluencer::create([
            'client_id'     => $user->id,
            'influencer_id' => $influencerId,
        ]);

        return response()->json(['status' => 'success', 'data' => ['saved' => true]]);
    }

    /**
     * GET /api/v1/saved
     * Return paginated saved influencers for the authenticated client.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $savedIds = SavedInfluencer::where('client_id', $user->id)
            ->pluck('influencer_id');

        $profiles = InfluencerProfile::with(['user', 'socialAccounts'])
            ->whereIn('user_id', $savedIds)
            ->whereHas('user', fn ($q) => $q->where('status', 'active'))
            ->orderByDesc('trust_score')
            ->paginate($request->get('per_page', 18));

        return response()->json(['status' => 'success', 'data' => $profiles]);
    }

    /**
     * GET /api/v1/saved/check/{influencerId}
     * Check if an influencer is saved by the current client.
     */
    public function check(Request $request, int $influencerId): JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->role !== 'client') {
            return response()->json(['status' => 'success', 'data' => ['saved' => false]]);
        }

        $saved = SavedInfluencer::where('client_id', $user->id)
            ->where('influencer_id', $influencerId)
            ->exists();

        return response()->json(['status' => 'success', 'data' => ['saved' => $saved]]);
    }

    /**
     * GET /api/v1/saved/count
     * Return count of saved influencers for badge.
     */
    public function count(Request $request): JsonResponse
    {
        $count = 0;
        if ($user = $request->user()) {
            $count = SavedInfluencer::where('client_id', $user->id)->count();
        }
        return response()->json(['status' => 'success', 'data' => ['count' => $count]]);
    }
}
