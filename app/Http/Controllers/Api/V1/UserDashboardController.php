<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Campaign;
use App\Models\CollaborationRequest;

class UserDashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role;
        $data = [];

        if ($role === 'client') {
            $data['total_campaigns'] = Campaign::where('client_id', $user->id)->count();
            $data['active_campaigns'] = Campaign::where('client_id', $user->id)->whereIn('status', ['published', 'active', 'agreed', 'negotiating'])->count();
            $data['total_spent'] = CollaborationRequest::whereHas('campaign', function($q) use($user) {
                $q->where('client_id', $user->id);
            })->whereIn('status', ['accepted', 'completed', 'active'])->sum('agreed_amount');
            
            $data['pending_requests'] = CollaborationRequest::whereHas('campaign', function($q) use($user) {
                $q->where('client_id', $user->id);
            })->where('status', 'pending')->count();

            $data['recent_requests'] = CollaborationRequest::with(['campaign', 'influencer'])
                ->whereHas('campaign', function($q) use($user) {
                    $q->where('client_id', $user->id);
                })
                ->latest()
                ->take(5)
                ->get();
        } elseif ($role === 'influencer') {
            $profile = $user->influencerProfile;
            if ($profile) {
                $data['trust_score'] = $profile->trust_score;
                $data['avg_rating'] = $profile->rating_avg;
                $data['total_earnings'] = CollaborationRequest::where('influencer_id', $user->id)
                    ->whereIn('status', ['accepted', 'completed'])
                    ->sum('agreed_amount');
                $data['active_campaigns'] = CollaborationRequest::where('influencer_id', $user->id)
                    ->where('status', 'accepted')
                    ->count();
                $data['pending_requests'] = CollaborationRequest::where('influencer_id', $user->id)
                    ->where('status', 'pending')
                    ->count();

                $data['recent_requests'] = CollaborationRequest::with(['campaign.clientProfile.user'])
                    ->where('influencer_id', $user->id)
                    ->latest()
                    ->take(5)
                    ->get();

                $data['recent_reviews'] = \App\Models\Review::with('reviewer')
                    ->where('reviewee_id', $user->id)
                    ->latest()
                    ->take(3)
                    ->get();
            }
        }

        return response()->json(['success' => true, 'data' => $data]);
    }
}
