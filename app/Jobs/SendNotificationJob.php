<?php

namespace App\Jobs;

use App\Models\NotificationLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 15;

    public function __construct(
        public readonly int   $userId,
        public readonly array $notification
    ) {}

    public function handle(): void
    {
        NotificationLog::create([
            'user_id'    => $this->userId,
            'type'       => $this->notification['type'],
            'title'      => $this->notification['title'],
            'body'       => $this->notification['body'] ?? null,
            'action_url' => $this->notification['action_url'] ?? null,
            'data'       => $this->notification['data'] ?? null,
        ]);

        Log::info('Notification sent', ['user_id' => $this->userId, 'type' => $this->notification['type']]);
    }
}
