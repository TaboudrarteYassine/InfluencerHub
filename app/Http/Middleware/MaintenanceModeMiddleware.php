<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;

class MaintenanceModeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $isMaintenance = Cache::remember('settings.maintenance_mode', 60, function () {
            $setting = \App\Models\Setting::where('key', 'maintenance_mode')->first();
            return $setting && $setting->value === 'true';
        });

        // Block all non-admin routes if maintenance is on
        if ($isMaintenance) {
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return response()->json([
                    'message' => 'Platform is currently undergoing maintenance. Please try again later.'
                ], 503);
            }
        }

        return $next($request);
    }
}
