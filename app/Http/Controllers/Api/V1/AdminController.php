<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AdminStatsService;
use App\Services\AdminUserService;
use App\Services\AdminCampaignService;
use App\Services\AdminTrustService;
use App\Services\AdminReviewService;
use App\Services\AdminCategoryService;
use App\Services\AdminActivityService;
use App\Services\AdminNotificationService;
use App\Services\AdminSecurityService;
use App\Services\AdminSettingsService;
use App\Services\AdminAnalyticsService;
use App\Services\AdminSearchService;
use App\Services\AdminReportService;

class AdminController extends Controller
{
    public function __construct(
        private readonly AdminStatsService $statsService,
        private readonly AdminUserService $userService,
        private readonly AdminCampaignService $campaignService,
        private readonly AdminTrustService $trustService,
        private readonly AdminReviewService $reviewService,
        private readonly AdminCategoryService $categoryService,
        private readonly AdminActivityService $activityService,
        private readonly AdminNotificationService $notificationService,
        private readonly AdminSecurityService $securityService,
        private readonly AdminSettingsService $settingsService,
        private readonly AdminAnalyticsService $analyticsService,
        private readonly AdminSearchService $searchService,
        private readonly AdminReportService $reportService,
        private readonly \App\Services\KYCService $kycService
    ) {}

    public function dashboardStats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->statsService->getDashboardStats()
        ]);
    }

    public function listUsers(Request $request): JsonResponse
    {
        $filters = $request->only(['role', 'status', 'search', 'per_page']);
        return response()->json([
            'success' => true,
            'data' => $this->userService->listUsers($filters)
        ]);
    }

    public function userDetails(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->userService->getUserDetails($id)
        ]);
    }

    public function suspendUser(int $id): JsonResponse
    {
        $this->userService->suspendUser($id);
        return response()->json(['success' => true, 'message' => 'User suspended']);
    }

    public function banUser(int $id): JsonResponse
    {
        $this->userService->banUser($id);
        return response()->json(['success' => true, 'message' => 'User banned']);
    }

    public function unbanUser(int $id): JsonResponse
    {
        $this->userService->unbanUser($id);
        return response()->json(['success' => true, 'message' => 'User activated']);
    }

    public function verifyInfluencer(int $id): JsonResponse
    {
        $this->userService->verifyInfluencer($id);
        return response()->json(['success' => true, 'message' => 'Influencer verified']);
    }

    public function rejectVerification(int $id): JsonResponse
    {
        $this->userService->rejectVerification($id);
        return response()->json(['success' => true, 'message' => 'Verification rejected']);
    }

    // --- KYC ---
    public function kycQueue(Request $request): JsonResponse
    {
        $profiles = \App\Models\InfluencerProfile::where('verification_status', 'pending')
            ->with([
                'user' => function($q) {
                    $q->select('id', 'name', 'email', 'full_name', 'username', 'phone_number', 'created_at');
                }
            ])
            ->orderBy('submitted_at', 'asc')
            ->paginate($request->input('per_page', 15));

        $profiles->getCollection()->transform(function ($profile) {
            $user = $profile->user;
            
            return [
                'id' => $profile->id,
                'user_id' => $profile->user_id,
                'full_name' => $user->full_name ?? $user->name,
                'username' => $user->username,
                'phone' => $user->phone_number,
                'email' => $user->email,
                'submitted_at' => $profile->submitted_at,
                'verification_status' => $profile->verification_status,
                'cin_front_url' => "/api/v1/admin/kyc/image/{$user->id}/cin_front",
                'selfie_url' => "/api/v1/admin/kyc/image/{$user->id}/selfie",
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $profiles
        ]);
    }

    public function getKycImage(int $userId, string $type)
    {
        if (!in_array($type, ['cin_front', 'selfie'])) {
            return response()->json(['error' => 'Invalid type'], 400);
        }

        $path = "kyc/{$userId}/{$type}.jpg";
        
        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($path)) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        \App\Models\ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'view_kyc_image',
            'description' => "Admin viewed {$type} image for user {$userId}",
            'ip_address' => request()->ip(),
        ]);

        return response()->file(storage_path("app/private/{$path}"));
    }

    public function approveKYC(int $userId): JsonResponse
    {
        $user = \App\Models\User::findOrFail($userId);
        $this->kycService->approveKYC($user, request()->user());
        return response()->json(['success' => true, 'message' => 'KYC approved']);
    }

    public function rejectKYC(Request $request, int $userId): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);
        $user = \App\Models\User::findOrFail($userId);
        $this->kycService->rejectKYC($user, $request->reason, request()->user());
        return response()->json(['success' => true, 'message' => 'KYC rejected']);
    }

    // --- Campaigns ---
    public function listCampaigns(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->campaignService->listCampaigns($request->all())]);
    }
    public function campaignDetails(int $id): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->campaignService->getCampaignDetails($id)]);
    }
    public function forceCancelCampaign(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);
        $this->campaignService->forceCancel($id, $request->reason, auth()->id());
        return response()->json(['success' => true, 'message' => 'Campaign cancelled']);
    }
    public function markCampaignCompleted(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);
        $this->campaignService->markCompleted($id, $request->reason, auth()->id());
        return response()->json(['success' => true, 'message' => 'Campaign marked as completed']);
    }
    public function flagCampaignSuspicious(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);
        $this->campaignService->flagSuspicious($id, $request->reason, auth()->id());
        return response()->json(['success' => true, 'message' => 'Campaign flagged as suspicious']);
    }

    // --- Trust Score ---
    public function listTrustScores(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->trustService->listInfluencers($request->all())]);
    }
    public function adjustTrustScore(Request $request, int $id): JsonResponse
    {
        $request->validate(['score' => 'required|integer', 'reason' => 'required|string']);
        $this->trustService->adjustScore($id, $request->score, $request->reason, auth()->id());
        return response()->json(['success' => true, 'message' => 'Score adjusted']);
    }
    public function recalculateTrustScore(int $id): JsonResponse
    {
        $this->trustService->recalculateUser($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Score recalculated']);
    }
    public function bulkRecalculateTrustScores(): JsonResponse
    {
        $this->trustService->bulkRecalculate(auth()->id());
        return response()->json(['success' => true, 'message' => 'Bulk recalculation triggered']);
    }
    public function trustScoreHistory(int $id): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->trustService->getScoreHistory($id)]);
    }

    // --- Reviews ---
    public function listReviews(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->reviewService->listReviews($request->all())]);
    }
    public function toggleReviewVisibility(Request $request, int $id): JsonResponse
    {
        $request->validate(['is_visible' => 'required|boolean']);
        $this->reviewService->toggleVisibility($id, $request->is_visible, auth()->id());
        return response()->json(['success' => true, 'message' => 'Visibility updated']);
    }
    public function flagFakeReview(int $id): JsonResponse
    {
        $this->reviewService->flagFake($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Review flagged as fake']);
    }
    public function deleteReview(int $id): JsonResponse
    {
        $this->reviewService->deleteReview($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Review deleted']);
    }
    public function sendReviewWarning(int $id): JsonResponse
    {
        $this->reviewService->sendWarning($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Warning sent to author']);
    }

    // --- Categories ---
    public function listCategories(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->categoryService->listCategories()]);
    }
    public function createCategory(Request $request): JsonResponse
    {
        $request->validate(['name' => 'required|string', 'slug' => 'required|string|unique:categories', 'icon' => 'nullable|string']);
        $this->categoryService->createCategory($request->all(), auth()->id());
        return response()->json(['success' => true, 'message' => 'Category created']);
    }
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $request->validate(['name' => 'required|string', 'slug' => 'required|string|unique:categories,slug,'.$id, 'icon' => 'nullable|string']);
        $this->categoryService->updateCategory($id, $request->all(), auth()->id());
        return response()->json(['success' => true, 'message' => 'Category updated']);
    }
    public function deleteCategory(int $id): JsonResponse
    {
        $this->categoryService->deleteCategory($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Category deleted']);
    }
    public function toggleCategoryVisibility(int $id): JsonResponse
    {
        $this->categoryService->toggleVisibility($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Category visibility updated']);
    }

    // --- Activity Log ---
    public function listActivityLogs(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->activityService->listLogs($request->all())]);
    }

    // --- Notifications ---
    public function sendNotification(Request $request): JsonResponse
    {
        $request->validate(['target' => 'required', 'title' => 'required', 'body' => 'required']);
        $result = $this->notificationService->sendBroadcast($request->all(), auth()->id());
        return response()->json(['success' => true, 'message' => "Notification sent to {$result['count']} users"]);
    }
    public function listNotifications(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->notificationService->listHistory($request->all())]);
    }

    // --- Security ---
    public function securityStats(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->securityService->getSecurityStats()]);
    }
    public function blockIp(Request $request): JsonResponse
    {
        $request->validate(['ip' => 'required', 'reason' => 'required']);
        $this->securityService->blockIp($request->ip, $request->reason, auth()->id());
        return response()->json(['success' => true, 'message' => 'IP blocked']);
    }
    public function whitelistIp(Request $request): JsonResponse
    {
        $request->validate(['ip' => 'required']);
        $this->securityService->whitelistIp($request->ip, auth()->id());
        return response()->json(['success' => true, 'message' => 'IP whitelisted']);
    }
    public function forceLogoutUser(int $id): JsonResponse
    {
        $this->securityService->forceLogoutUser($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'User logged out']);
    }
    public function forceLogoutAll(): JsonResponse
    {
        $this->securityService->forceLogoutAll(auth()->id());
        return response()->json(['success' => true, 'message' => 'All users logged out']);
    }

    // --- Settings ---
    public function getSettings(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->settingsService->getSettings()]);
    }
    public function updateSettings(Request $request): JsonResponse
    {
        $this->settingsService->updateSettings($request->all(), auth()->id());
        return response()->json(['success' => true, 'message' => 'Settings updated']);
    }

    // --- Analytics ---
    public function analyticsCharts(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->analyticsService->getChartsData()]);
    }

    // --- Search ---
    public function globalSearch(Request $request): JsonResponse
    {
        $query = $request->query('q', '');
        return response()->json(['success' => true, 'data' => $this->searchService->globalSearch($query)]);
    }

    // --- Reports ---
    public function getReports(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->reportService->getReports($request->all())]);
    }
    public function warnReportUser(int $id): JsonResponse
    {
        $this->reportService->warnUser($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'User warned']);
    }
    public function dismissReport(int $id): JsonResponse
    {
        $this->reportService->dismissReport($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Report dismissed']);
    }
    public function resolveReport(int $id): JsonResponse
    {
        $this->reportService->resolveReport($id, auth()->id());
        return response()->json(['success' => true, 'message' => 'Report resolved']);
    }
}
