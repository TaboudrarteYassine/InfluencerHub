<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\InfluencerRepositoryInterface;
use App\Services\InfluencerService;
use App\Http\Requests\Influencer\UpdateProfileRequest;
use App\Http\Requests\Influencer\AddSocialAccountRequest;
use App\Models\PortfolioItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfluencerController extends Controller
{
    public function __construct(
        public readonly InfluencerRepositoryInterface $influencerRepo,
        private readonly InfluencerService $influencerService,
        private readonly \App\Services\MediaService $mediaService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search', 'country', 'city', 'availability', 'is_verified',
            'price_min', 'price_max', 'trust_score_min', 'niche', 'niches',
            'platform', 'followers_min', 'engagement_min',
            'sort', 'direction',
        ]);

        $results = $this->influencerService->search($filters, $request->get('per_page', 18));

        return response()->json([
            'success' => true,
            'data'    => $results,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $profile = $this->influencerRepo->findById($id);

        return response()->json([
            'success' => true,
            'data'    => ['profile' => $profile],
        ]);
    }

    public function publicProfile(string $username): JsonResponse
    {
        $user = \App\Models\User::where('username', $username)->first();

        if (!$user || !$user->hasRole('influencer') || !$user->influencerProfile) {
            return response()->json(['success' => false, 'message' => 'Profile not found.'], 404);
        }

        $profile = $user->influencerProfile;
        
        $publicData = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar,
            'bio' => $profile->bio,
            'cover_image' => $profile->cover_image,
            'niches' => $profile->niches,
            'city' => $profile->city,
            'country' => $profile->country,
            'languages' => $profile->languages,
            'trust_score' => $profile->trust_score,
            'is_verified' => $profile->is_verified,
            'verification_status' => $profile->verification_status,
            'avg_rating' => $profile->avg_rating,
            'total_reviews' => $profile->total_reviews,
            'price_min' => $profile->price_min,
            'price_max' => $profile->price_max,
            'social_accounts' => $profile->socialAccounts,
            'portfolio_items' => \App\Models\PortfolioItem::where('user_id', $user->id)->orderBy('order')->get(),
            'reviews' => \App\Models\Review::with('reviewer:id,name,avatar')
                            ->where('reviewee_id', $user->id)
                            ->where('is_visible', true)
                            ->orderByDesc('created_at')
                            ->take(10)
                            ->get(),
        ];

        return response()->json([
            'success' => true,
            'data'    => ['profile' => $publicData],
        ]);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $profile = $this->influencerService->getProfile($request->user()->id);

        return response()->json([
            'success' => true,
            'data'    => ['profile' => $profile],
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $profile = $this->influencerService->updateProfile(
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data'    => ['profile' => $profile],
        ]);
    }

    public function addSocialAccount(AddSocialAccountRequest $request): JsonResponse
    {
        $account = $this->influencerService->addSocialAccount(
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Social account added.',
            'data'    => ['account' => $account],
        ], 201);
    }

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

    public function featured(): JsonResponse
    {
        $profiles = $this->influencerService->getFeatured(12);

        return response()->json([
            'success' => true,
            'data'    => ['influencers' => $profiles],
        ]);
    }

    public function myRequests(Request $request): JsonResponse
    {
        $profile = $request->user()->influencerProfile;
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Profile not found'], 404);
        }

        $query = \App\Models\CollaborationRequest::with(['campaign.clientProfile.user'])
            ->where('influencer_id', $request->user()->id)
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

    // ─── Portfolio ───────────────────────────────────────────────────

    public function getPortfolio(int $userId): JsonResponse
    {
        $items = PortfolioItem::where('user_id', $userId)
            ->orderBy('order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['success' => true, 'data' => ['items' => $items]]);
    }

    public function addPortfolioItem(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'media_type' => 'required|in:image,video,link',
            'external_url' => 'nullable|url',
            'media' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,webm|max:20480'
        ]);

        $mediaUrl = '';
        if ($request->hasFile('media')) {
            $mediaUrl = $this->mediaService->upload($request->file('media'), 'portfolio');
        } elseif ($request->media_type === 'link') {
            $mediaUrl = $request->external_url;
        }

        $item = PortfolioItem::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'media_type' => $request->media_type,
            'media_url' => $mediaUrl,
            'external_url' => $request->external_url,
            'order' => PortfolioItem::where('user_id', $request->user()->id)->count(),
        ]);

        return response()->json(['success' => true, 'data' => ['item' => $item]], 201);
    }

    public function updatePortfolioItem(Request $request, int $id): JsonResponse
    {
        $item = PortfolioItem::where('user_id', $request->user()->id)->findOrFail($id);
        
        $item->update($request->only(['title', 'description', 'external_url', 'order']));
        
        return response()->json(['success' => true, 'data' => ['item' => $item]]);
    }

    public function deletePortfolioItem(Request $request, int $id): JsonResponse
    {
        $item = PortfolioItem::where('user_id', $request->user()->id)->findOrFail($id);
        $item->delete();
        
        return response()->json(['success' => true, 'message' => 'Portfolio item deleted']);
    }
}
