<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\MediaService;

class ClientController extends Controller
{
    public function __construct(
        private readonly MediaService $mediaService
    ) {}

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|image|max:2048']);
        $url = $this->mediaService->uploadAvatar($request->file('avatar'), $request->user()->id);
        
        $request->user()->update(['avatar' => $url]);
        
        return response()->json([
            'success' => true,
            'message' => 'Avatar updated successfully.',
            'data'    => ['avatar' => $url],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'description'  => 'required|string',
            'industry'     => 'required|string|max:100',
            'company_size' => 'required|string|max:50',
            'website'      => 'nullable|url|max:255',
        ]);

        $profile = $request->user()->clientProfile()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $request->only(['company_name', 'description', 'industry', 'company_size', 'website', 'country', 'city'])
        );

        return response()->json(['success' => true, 'data' => ['profile' => $profile]]);
    }

    public function myRequests(Request $request): JsonResponse
    {
        $profile = $request->user()->clientProfile;
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Profile not found'], 404);
        }

        $query = \App\Models\CollaborationRequest::with([
                'campaign',
                'influencer.influencerProfile',
                'negotiations',
                'conversation',
            ])
            ->whereHas('campaign', function ($q) use ($request) {
                $q->where('client_id', $request->user()->id);
            })
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $requests = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $requests,
        ]);
    }
}
