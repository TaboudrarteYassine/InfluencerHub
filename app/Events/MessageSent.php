<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Message $message) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("conversation.{$this->message->conversation_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id'             => $this->message->id,
                'conversation_id'=> $this->message->conversation_id,
                'sender_id'      => $this->message->sender_id,
                'sender'         => $this->message->sender,
                'body'           => $this->message->body,
                'type'           => $this->message->type,
                'attachment_path'=> $this->message->attachment_path,
                'attachment_type'=> $this->message->attachment_type,
                'is_flagged'     => $this->message->is_flagged,
                'created_at'     => $this->message->created_at,
            ],
        ];
    }
}
