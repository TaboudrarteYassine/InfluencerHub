<?php

namespace App\Services;

use App\Models\User;
use App\Models\NotificationLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminNotificationService
{
    public function sendBroadcast(array $data, int $adminId)
    {
        $target = $data['target']; // all, influencers, clients, specific_user
        $title = $data['title'];
        $body = $data['body'];
        $link = $data['link'] ?? null;

        $query = User::query();

        if ($target === 'influencers') {
            $query->where('role', 'influencer');
        } elseif ($target === 'clients') {
            $query->where('role', 'client');
        } elseif ($target === 'specific_user' && !empty($data['user_id'])) {
            $query->where('id', $data['user_id']);
        }

        $users = $query->get();
        $count = $users->count();

        // In a real app, dispatch a Job here: BroadcastNotificationJob::dispatch($users, $title, $body, $link);
        // For now, we simulate success and log it to NotificationLog

        NotificationLog::create([
            'user_id' => $adminId, // sender
            'type' => 'broadcast',
            'data' => json_encode([
                'title' => $title,
                'body' => $body,
                'link' => $link,
                'target' => $target,
                'delivery_count' => $count
            ])
        ]);

        \App\Models\ActivityLog::create([
            'user_id' => $adminId,
            'action' => 'send_broadcast_notification',
            'entity_type' => 'System',
            'entity_id' => 0,
            'description' => "Sent broadcast to $target ($count users)"
        ]);

        return ['count' => $count];
    }

    public function listHistory(array $filters): LengthAwarePaginator
    {
        return NotificationLog::with('user:id,name')
            ->where('type', 'broadcast')
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 15);
    }
}
