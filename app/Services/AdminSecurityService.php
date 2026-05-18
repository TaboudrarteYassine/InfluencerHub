<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\BlockedIp;
use App\Models\User;
use App\Models\Message;
use Laravel\Sanctum\PersonalAccessToken;

class AdminSecurityService
{
    public function getSecurityStats()
    {
        return [
            'failed_logins' => ActivityLog::where('action', 'failed_login')->orderByDesc('created_at')->take(50)->get(),
            'blocked_ips' => BlockedIp::with('blocker:id,name')->get(),
            'active_sessions' => PersonalAccessToken::with('tokenable:id,name,email,role')->orderByDesc('last_used_at')->take(50)->get(),
            'flagged_messages_count' => Message::where('is_flagged', true)->count(),
            'flagged_messages' => Message::with(['sender', 'conversation'])->where('is_flagged', true)->orderByDesc('created_at')->take(20)->get(),
            'admin_audit_today' => ActivityLog::whereDate('created_at', today())->whereHas('user', function($q) { $q->where('role', 'admin'); })->count(),
        ];
    }

    public function blockIp(string $ip, string $reason, int $adminId)
    {
        BlockedIp::create(['ip_address' => $ip, 'reason' => $reason, 'blocked_by' => $adminId]);
        $this->log($adminId, 'block_ip', 'System', 0, $ip);
    }

    public function whitelistIp(string $ip, int $adminId)
    {
        BlockedIp::where('ip_address', $ip)->delete();
        $this->log($adminId, 'whitelist_ip', 'System', 0, $ip);
    }

    public function forceLogoutUser(int $userId, int $adminId)
    {
        $user = User::findOrFail($userId);
        $user->tokens()->delete();
        $this->log($adminId, 'force_logout_user', 'User', $userId, 'Tokens deleted');
    }

    public function forceLogoutAll(int $adminId)
    {
        PersonalAccessToken::where('tokenable_id', '!=', $adminId)->delete();
        $this->log($adminId, 'force_logout_all', 'System', 0, 'All user tokens except current admin deleted');
    }

    private function log($adminId, $action, $type, $id, $desc)
    {
        ActivityLog::create([
            'user_id' => $adminId, 'action' => $action, 'target_type' => $type,
            'target_id' => $id, 'description' => $desc, 'ip_address' => request()->ip()
        ]);
    }
}
