<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\InfluencerController;
use App\Http\Controllers\Api\V1\CampaignController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\AdminController;
use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════════════════════════
// API v1 Routes — Influencer Marketplace
// ═══════════════════════════════════════════════════════════

Route::prefix('v1')->group(function () {

    // ─── Public: Auth ────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
        Route::post('/login',    [AuthController::class, 'login'])->name('auth.login');
    });

    // ─── Public: Discovery ───────────────────────────────────────────
    Route::get('/influencers',          [InfluencerController::class, 'index'])->name('influencers.index');
    Route::get('/influencers/featured', [InfluencerController::class, 'featured'])->name('influencers.featured');
    Route::get('/influencers/@{username}', [InfluencerController::class, 'publicProfile'])->name('influencers.public_profile');
    Route::get('/influencers/{id}',     [InfluencerController::class, 'show'])->name('influencers.show');
    Route::get('/campaigns',            [CampaignController::class, 'index'])->name('campaigns.index');
    Route::get('/campaigns/public',     [CampaignController::class, 'publicCampaigns'])->name('campaigns.public');
    Route::get('/campaigns/{id}',       [CampaignController::class, 'show'])->name('campaigns.show');

    // ─── Webhooks ────────────────────────────────────────────────────
    Route::post('/webhooks/stripe', [\App\Http\Controllers\Api\V1\StripeWebhookController::class, 'handle'])->name('webhooks.stripe');

    // ─── Authenticated ───────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth management
        Route::prefix('auth')->group(function () {
            Route::post('/logout',     [AuthController::class, 'logout'])->name('auth.logout');
            Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('auth.logout-all');
            Route::get('/me',          [AuthController::class, 'me'])->name('auth.me');
            Route::get('/check-username', [AuthController::class, 'checkUsername'])->name('auth.check-username');
        });

        Route::get('/dashboard/stats', [App\Http\Controllers\Api\V1\UserDashboardController::class, 'stats'])->name('dashboard.stats');

        // ─── Onboarding (no role check — newly registered users) ────────
        // These routes only require authentication, not a Spatie role,
        // because the role may not yet be synced for brand-new accounts.
        Route::prefix('onboarding')->group(function () {
            Route::put('/influencer', function (\Illuminate\Http\Request $request) {
                $user = $request->user();

                // Ensure Spatie role is set
                if (!$user->hasRole('influencer')) {
                    $user->assignRole('influencer');
                }

                $profile = $user->influencerProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $request->only([
                        'display_name', 'bio', 'country', 'city',
                        'niches', 'languages', 'price_min', 'price_max',
                        'availability',
                    ])
                );

                return response()->json(['success' => true, 'data' => ['profile' => $profile]]);
            })->name('onboarding.influencer');

            Route::post('/influencer/social', function (\Illuminate\Http\Request $request) {
                $user = $request->user();
                $request->validate([
                    'platform'        => 'required|in:tiktok,instagram,youtube,twitter',
                    'username'        => 'required|string|max:100',
                    'followers_count' => 'required|integer|min:0',
                    'engagement_rate' => 'nullable|numeric|min:0|max:100',
                ]);

                $profile = $user->influencerProfile()->firstOrCreate(['user_id' => $user->id]);
                $account = $profile->socialAccounts()->updateOrCreate(
                    ['platform' => $request->platform],
                    [
                        'username'        => $request->username,
                        'followers_count' => $request->followers_count,
                        'engagement_rate' => $request->engagement_rate ?? 0,
                    ]
                );

                return response()->json(['success' => true, 'data' => ['account' => $account]], 201);
            })->name('onboarding.influencer.social');

            Route::put('/client', function (\Illuminate\Http\Request $request) {
                $user = $request->user();

                if (!$user->hasRole('client')) {
                    $user->assignRole('client');
                }

                $profile = $user->clientProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $request->only([
                        'company_name', 'description', 'industry',
                        'company_size', 'website', 'country', 'city',
                    ])
                );

                return response()->json(['success' => true, 'data' => ['profile' => $profile]]);
            })->name('onboarding.client');

            // Mark user as onboarded
            Route::post('/complete', function (\Illuminate\Http\Request $request) {
                $request->user()->update(['is_onboarded' => true]);
                return response()->json(['success' => true, 'message' => 'Onboarding complete!']);
            })->name('onboarding.complete');
        });

        // ─── Influencer routes (Protected by KYC) ───────────────────
        Route::prefix('influencer')->middleware(['role:influencer', 'kyc'])->group(function () {
            Route::post('/avatar',            [InfluencerController::class, 'updateAvatar'])->name('influencer.avatar.update');
            Route::get('/profile',            [InfluencerController::class, 'myProfile'])->name('influencer.profile');
            Route::put('/profile',            [InfluencerController::class, 'updateProfile'])->name('influencer.profile.update');
            Route::post('/social-accounts',   [InfluencerController::class, 'addSocialAccount'])->name('influencer.social.add');
            Route::get('/requests',           [InfluencerController::class, 'myRequests'])->name('influencer.requests');
            Route::get('/portfolio/{userId}', [InfluencerController::class, 'getPortfolio'])->name('influencer.portfolio.get');
            Route::post('/portfolio',         [InfluencerController::class, 'addPortfolioItem'])->name('influencer.portfolio.add');
            Route::put('/portfolio/{id}',     [InfluencerController::class, 'updatePortfolioItem'])->name('influencer.portfolio.update');
            Route::delete('/portfolio/{id}',  [InfluencerController::class, 'deletePortfolioItem'])->name('influencer.portfolio.delete');
            Route::post('/campaigns/{id}/apply', [CampaignController::class, 'applyToCampaign'])->name('influencer.campaigns.apply');
        });

        // ─── KYC Routes (Influencer only, no kyc middleware) ────────
        Route::prefix('kyc')->middleware('role:influencer')->group(function () {
            Route::get('/status',      [\App\Http\Controllers\Api\V1\KYCController::class, 'status']);
            Route::post('/submit',     [\App\Http\Controllers\Api\V1\KYCController::class, 'submit']);
            Route::post('/resubmit',   [\App\Http\Controllers\Api\V1\KYCController::class, 'resubmit']);
        });

        // ─── Client routes ────────────────────────────────────────────
        Route::prefix('client')->middleware('role:client')->group(function () {
            Route::get('/campaigns',                       [CampaignController::class, 'myCampaigns'])->name('client.campaigns');
            Route::post('/campaigns',                      [CampaignController::class, 'store'])->name('client.campaigns.create');
            Route::put('/campaigns/{id}',                  [CampaignController::class, 'update'])->name('client.campaigns.update');
            Route::delete('/campaigns/{id}',               [CampaignController::class, 'destroy'])->name('client.campaigns.delete');
            Route::post('/campaigns/{id}/publish',         [CampaignController::class, 'publish'])->name('client.campaigns.publish');
            Route::post('/campaigns/{id}/request',         [CampaignController::class, 'sendRequest'])->name('client.campaigns.request');
            Route::post('/campaigns/{id}/complete',        [CampaignController::class, 'markCompleted'])->name('client.campaigns.complete');
            Route::get('/campaigns/{id}/ai-matches',       [CampaignController::class, 'aiMatches'])->name('client.campaigns.ai-matches');
            Route::post('/avatar', [ClientController::class, 'updateAvatar'])->name('client.avatar');
            Route::put('/profile', [ClientController::class, 'updateProfile'])->name('client.profile');
        });

        // ─── Saved Influencers (client only) ─────────────────────────
        Route::prefix('saved')->middleware('role:client')->group(function () {
            Route::get('/',                    [\App\Http\Controllers\Api\V1\SavedController::class, 'index'])->name('saved.index');
            Route::get('/count',               [\App\Http\Controllers\Api\V1\SavedController::class, 'count'])->name('saved.count');
            Route::get('/check/{influencerId}',[\App\Http\Controllers\Api\V1\SavedController::class, 'check'])->name('saved.check');
            Route::post('/{influencerId}',     [\App\Http\Controllers\Api\V1\SavedController::class, 'toggle'])->name('saved.toggle');
        });

        // ─── Shared Campaign Actions ──────────────────────────────────
        Route::prefix('campaigns/requests')->group(function () {
            Route::post('/{id}/respond',      [CampaignController::class, 'respondToRequest'])->name('campaigns.requests.respond');
            Route::post('/{id}/confirm-deal', [CampaignController::class, 'confirmDeal'])->name('campaigns.requests.confirm');
        });

        // ─── Notifications ────────────────────────────────────────────
        Route::prefix('notifications')->group(function () {
            Route::get('/',            [NotificationController::class, 'index'])->name('notifications.index');
            Route::get('/unread-count',[NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
            Route::post('/{id}/read',  [NotificationController::class, 'markRead'])->name('notifications.read');
            Route::post('/read-all',   [NotificationController::class, 'markAll'])->name('notifications.read-all');
        });

        // ─── Reviews ───────────────────────────────────────────────
        Route::prefix('reviews')->group(function () {
            Route::get('/influencer/{userId}', [App\Http\Controllers\Api\V1\ReviewController::class, 'getInfluencerReviews']);
            Route::get('/client/{userId}', [App\Http\Controllers\Api\V1\ReviewController::class, 'getClientReviews']);
            Route::get('/can-review/{campaignId}', [App\Http\Controllers\Api\V1\ReviewController::class, 'canReview']);
            Route::post('/', [App\Http\Controllers\Api\V1\ReviewController::class, 'submitReview']);
        });

        // ─── Reports ───────────────────────────────────────────────
        Route::post('/reports', [App\Http\Controllers\Api\V1\ReportController::class, 'store'])->name('reports.store');

        // ─── Payments & Escrow ─────────────────────────────────────────
        Route::prefix('payments')->group(function () {
            Route::post('/intent',                       [\App\Http\Controllers\Api\V1\PaymentController::class, 'createIntent']);
            Route::post('/release/{transactionId}',      [\App\Http\Controllers\Api\V1\PaymentController::class, 'releasePayment']);
            Route::post('/refund/{transactionId}',       [\App\Http\Controllers\Api\V1\PaymentController::class, 'refundPayment']);
            Route::get('/transaction/{collaborationId}', [\App\Http\Controllers\Api\V1\PaymentController::class, 'getTransaction']);
            Route::post('/stripe/onboard',               [\App\Http\Controllers\Api\V1\PaymentController::class, 'stripeOnboard']);
            Route::get('/stripe/onboard/status',         [\App\Http\Controllers\Api\V1\PaymentController::class, 'stripeOnboardStatus']);
        });

        // ─── Analytics ────────────────────────────────────────────────
        Route::prefix('analytics')->group(function () {
            Route::post('/submit',                       [\App\Http\Controllers\Api\V1\AnalyticsController::class, 'submitAnalytics']);
            Route::get('/my-stats',                      [\App\Http\Controllers\Api\V1\AnalyticsController::class, 'myStats']);
            Route::get('/collaboration/{id}',            [\App\Http\Controllers\Api\V1\AnalyticsController::class, 'collaborationAnalytics']);
        });

        // ─── Client profile ───────────────────────────────────────────
        Route::prefix('client')->middleware('role:client')->group(function () {
            Route::post('/avatar', [ClientController::class, 'updateAvatar'])->name('client.avatar.update');
            Route::put('/profile', [ClientController::class, 'updateProfile'])->name('client.profile.update');
        });
        // ─── Chat routes (all authenticated users) ────────────────────
        Route::prefix('chat')->group(function () {
            Route::post('/upload',                       [ChatController::class, 'uploadAttachment'])->name('chat.upload');
            Route::post('/conversations/direct',         [ChatController::class, 'startDirect'])->name('chat.start-direct');
            Route::get('/conversations',                 [ChatController::class, 'conversations'])->name('chat.conversations');
            Route::get('/conversations/{id}/messages',  [ChatController::class, 'messages'])->name('chat.messages');
            Route::post('/conversations/{id}/messages', [ChatController::class, 'send'])->name('chat.send');
            Route::post('/conversations/{id}/read',     [ChatController::class, 'markRead'])->name('chat.read');
            Route::post('/conversations/{id}/typing',   [ChatController::class, 'typing'])->name('chat.typing');
        });

        // ─── Admin routes ──────────────────────────────────────────────
        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/dashboard',                [AdminController::class, 'dashboardStats'])->name('admin.dashboard');
            
            // Users
            Route::get('/users',                    [AdminController::class, 'listUsers'])->name('admin.users.list');
            Route::get('/users/{id}',               [AdminController::class, 'userDetails'])->name('admin.users.show');
            Route::post('/users/{id}/suspend',      [AdminController::class, 'suspendUser'])->name('admin.users.suspend');
            Route::post('/users/{id}/ban',          [AdminController::class, 'banUser'])->name('admin.users.ban');
            Route::post('/users/{id}/unban',        [AdminController::class, 'unbanUser'])->name('admin.users.unban');
            Route::post('/users/{id}/verify',       [AdminController::class, 'verifyInfluencer'])->name('admin.users.verify');
            Route::post('/users/{id}/reject',       [AdminController::class, 'rejectVerification'])->name('admin.users.reject');

            // KYC Queue
            Route::get('/kyc/queue',                [AdminController::class, 'kycQueue'])->name('admin.kyc.queue');
            Route::get('/kyc/image/{userId}/{type}',[AdminController::class, 'getKycImage'])->name('admin.kyc.image');
            Route::post('/kyc/{userId}/approve',    [AdminController::class, 'approveKYC'])->name('admin.kyc.approve');
            Route::post('/kyc/{userId}/reject',     [AdminController::class, 'rejectKYC'])->name('admin.kyc.reject');

            // Campaigns
            Route::get('/campaigns',                      [AdminController::class, 'listCampaigns']);
            Route::get('/campaigns/{id}',                 [AdminController::class, 'campaignDetails']);
            Route::post('/campaigns/{id}/cancel',         [AdminController::class, 'forceCancelCampaign']);
            Route::post('/campaigns/{id}/complete',       [AdminController::class, 'markCampaignCompleted']);
            Route::post('/campaigns/{id}/flag',           [AdminController::class, 'flagCampaignSuspicious']);

            // Trust Score
            Route::get('/trust',                          [AdminController::class, 'listTrustScores']);
            Route::post('/trust/bulk-recalculate',        [AdminController::class, 'bulkRecalculateTrustScores']);
            Route::post('/trust/{id}/adjust',             [AdminController::class, 'adjustTrustScore']);
            Route::post('/trust/{id}/recalculate',        [AdminController::class, 'recalculateTrustScore']);
            Route::get('/trust/{id}/history',             [AdminController::class, 'trustScoreHistory']);

            // Reviews
            Route::get('/reviews',                        [AdminController::class, 'listReviews']);
            Route::post('/reviews/{id}/visibility',       [AdminController::class, 'toggleReviewVisibility']);
            Route::post('/reviews/{id}/flag',             [AdminController::class, 'flagFakeReview']);
            Route::post('/reviews/{id}/warning',          [AdminController::class, 'sendReviewWarning']);
            Route::delete('/reviews/{id}',                [AdminController::class, 'deleteReview']);

            // Categories
            Route::get('/categories',                     [AdminController::class, 'listCategories']);
            Route::post('/categories',                    [AdminController::class, 'createCategory']);
            Route::put('/categories/{id}',                [AdminController::class, 'updateCategory']);
            Route::delete('/categories/{id}',             [AdminController::class, 'deleteCategory']);
            Route::post('/categories/{id}/visibility',    [AdminController::class, 'toggleCategoryVisibility']);

            // Activity Log
            Route::get('/activity',                       [AdminController::class, 'listActivityLogs']);

            // Notifications
            Route::get('/notifications',                  [AdminController::class, 'listNotifications']);
            Route::post('/notifications/send',            [AdminController::class, 'sendNotification']);

            // Security
            Route::get('/security',                       [AdminController::class, 'securityStats']);
            Route::post('/security/ip/block',             [AdminController::class, 'blockIp']);
            Route::post('/security/ip/whitelist',         [AdminController::class, 'whitelistIp']);
            Route::post('/security/users/{id}/logout',    [AdminController::class, 'forceLogoutUser']);
            Route::post('/security/users/logout-all',     [AdminController::class, 'forceLogoutAll']);

            // Settings
            Route::get('/settings',                       [AdminController::class, 'getSettings']);
            Route::post('/settings',                      [AdminController::class, 'updateSettings']);

            // Analytics
            Route::get('/analytics',                      [AdminController::class, 'analyticsCharts']);

            // Search
            Route::get('/search',                         [AdminController::class, 'globalSearch']);

            // Reports
            Route::get('/reports',                        [AdminController::class, 'getReports']);
            Route::post('/reports/{id}/warn',             [AdminController::class, 'warnReportUser']);
            Route::post('/reports/{id}/dismiss',          [AdminController::class, 'dismissReport']);
            Route::post('/reports/{id}/resolve',          [AdminController::class, 'resolveReport']);

            // Payments
            Route::get('/payments/transactions',          [\App\Http\Controllers\Api\V1\PaymentController::class, 'getTransactions']);
        });
    });
});
