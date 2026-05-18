<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AnalyticsService;
use App\Models\CampaignAnalytics;

class AnalyticsController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function submitAnalytics(Request $request)
    {
        if (auth()->user()->role !== 'influencer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'collaboration_request_id' => 'required|exists:collaboration_requests,id',
            'reach' => 'required|integer|min:0',
            'impressions' => 'required|integer|min:0',
            'likes' => 'required|integer|min:0',
            'comments' => 'required|integer|min:0',
            'shares' => 'required|integer|min:0',
            'clicks' => 'required|integer|min:0',
            'post_url' => 'nullable|url',
        ]);

        try {
            $analytics = $this->analyticsService->submitAnalytics($validated['collaboration_request_id'], $validated);
            return response()->json(['status' => 'success', 'data' => ['analytics' => $analytics]]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function myStats(Request $request)
    {
        if (auth()->user()->role !== 'influencer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = $this->analyticsService->getInfluencerStats(auth()->id());
        
        return response()->json(['status' => 'success', 'data' => $stats]);
    }

    public function collaborationAnalytics($id)
    {
        $analytics = CampaignAnalytics::where('collaboration_request_id', $id)->first();
        
        if (!$analytics) {
            return response()->json(['message' => 'Analytics not found.'], 404);
        }

        // Must be participant or admin
        $collab = $analytics->collaborationRequest;
        if ($collab->influencer_id !== auth()->id() && $collab->client_id !== auth()->id() && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['status' => 'success', 'data' => ['analytics' => $analytics]]);
    }
}
