<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class KYCMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Allow access to profile and other essential routes regardless of KYC status
        if ($request->is('api/v1/influencer/profile') || $request->is('api/v1/influencer/avatar')) {
            return $next($request);
        }

        if ($user && $user->role === 'influencer') {
            $profile = $user->influencerProfile;
            
            if (!$profile || $profile->verification_status !== 'approved') {
                return response()->json([
                    'message' => 'Account pending verification',
                    'status' => $profile->verification_status ?? 'not_submitted',
                    'note' => $profile->verification_note,
                ], 403);
            }
        }

        return $next($request);
    }
}
