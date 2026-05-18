<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\ReviewService;

class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $reviewService) {}

    public function submitReview(Request $request): JsonResponse
    {
        $request->validate([
            'campaign_id' => 'required|exists:campaigns,id',
            'rating'      => 'required|integer|min:1|max:5',
            'comment'     => 'nullable|string|max:1000'
        ]);

        try {
            $review = $this->reviewService->createReview($request->all(), auth()->id());
            return response()->json(['success' => true, 'message' => 'Review submitted successfully', 'data' => $review]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function getInfluencerReviews(int $userId): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->reviewService->getInfluencerReviews($userId)]);
    }

    public function getClientReviews(int $userId): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->reviewService->getClientReviews($userId)]);
    }

    public function canReview(int $campaignId): JsonResponse
    {
        $canReview = $this->reviewService->canReview($campaignId, auth()->id());
        return response()->json(['success' => true, 'data' => ['can_review' => $canReview]]);
    }
}
