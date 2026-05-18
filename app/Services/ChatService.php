<?php

namespace App\Services;

use App\Models\Message;
use App\Models\Conversation;
use App\Models\NotificationLog;
use App\Events\MessageSent;
use App\Events\TypingIndicator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ChatService
{
    public function __construct(
        private readonly AiModerationService $moderationService
    ) {}

    public function sendMessage(int $conversationId, int $senderId, array $data): Message
    {
        $conversation = Conversation::with('participants')->findOrFail($conversationId);

        // Ensure sender is a participant
        $isParticipant = $conversation->participants->contains('id', $senderId);
        if (!$isParticipant) {
            throw ValidationException::withMessages(['conversation' => ['You are not a participant in this conversation.']]);
        }

        // Handle file upload
        $attachmentPath = null;
        $attachmentType = null;
        if (!empty($data['attachment'])) {
            $file = $data['attachment'];
            $this->validateAttachment($file);
            $attachmentPath = $file->store("chat/{$conversationId}", 'public');
            $attachmentType = $this->detectAttachmentType($file);
        }

        // Run AI moderation on text
        $moderationResult = null;
        $isFlagged        = false;
        $moderationScore  = null;

        if (!empty($data['body'])) {
            $modResult = $this->moderationService->moderateText($data['body']);
            $isFlagged       = $modResult['flagged'];
            $moderationScore = $modResult['score'];
            $moderationResult= $modResult['categories'];
        }

        $message = Message::create([
            'conversation_id'  => $conversationId,
            'sender_id'        => $senderId,
            'body'             => $data['body'] ?? null,
            'attachment_path'  => $attachmentPath,
            'attachment_type'  => $attachmentType,
            'type'             => $data['type'] ?? 'text',
            'metadata'         => $data['metadata'] ?? null,
            'is_flagged'       => $isFlagged,
            'moderation_score' => $moderationScore,
            'moderation_result'=> $moderationResult,
        ]);

        // Update conversation last_message_at
        $conversation->update(['last_message_at' => now()]);

        // Broadcast via WebSocket (Reverb)
        broadcast(new MessageSent($message->load('sender')))->toOthers();

        // Notify other participants
        foreach ($conversation->participants as $participant) {
            if ($participant->id !== $senderId) {
                NotificationLog::create([
                    'user_id'    => $participant->id,
                    'type'       => 'new_message',
                    'title'      => 'New Message',
                    'body'       => $data['body'] ? substr($data['body'], 0, 100) : 'Sent an attachment',
                    'action_url' => "/chat/{$conversationId}",
                    'data'       => ['conversation_id' => $conversationId, 'message_id' => $message->id],
                ]);
            }
        }

        return $message;
    }

    public function markAsRead(int $conversationId, int $userId): void
    {
        $conversation = Conversation::findOrFail($conversationId);

        // Update participant's last_read_at
        $conversation->participants()->updateExistingPivot($userId, [
            'last_read_at' => now(),
        ]);

        // Mark all messages as read
        Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function broadcastTyping(int $conversationId, int $userId, bool $isTyping): void
    {
        broadcast(new TypingIndicator($conversationId, $userId, $isTyping))->toOthers();
    }

    public function getMessages(int $conversationId, int $userId, int $perPage = 30)
    {
        $conversation = Conversation::findOrFail($conversationId);

        if (!$conversation->participants->contains('id', $userId)) {
            throw ValidationException::withMessages(['conversation' => ['Unauthorized.']]);
        }

        return Message::where('conversation_id', $conversationId)
            ->with('sender:id,name,avatar')
            ->where('is_flagged', false) // Hide flagged messages for regular users
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    private function validateAttachment($file): void
    {
        $maxSize  = 10 * 1024; // 10MB in KB
        $allowed  = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'mov'];

        if ($file->getSize() / 1024 > $maxSize) {
            throw ValidationException::withMessages(['attachment' => ['File too large. Max 10MB.']]);
        }
        if (!in_array($file->getClientOriginalExtension(), $allowed)) {
            throw ValidationException::withMessages(['attachment' => ['File type not allowed.']]);
        }
    }

    private function detectAttachmentType($file): string
    {
        $images = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $videos = ['mp4', 'mov', 'avi'];
        $ext    = $file->getClientOriginalExtension();

        if (in_array($ext, $images)) return 'image';
        if (in_array($ext, $videos)) return 'video';
        return 'file';
    }

    public function startDirectConversation(int $senderId, int $recipientId): Conversation
    {
        if ($senderId === $recipientId) {
            throw ValidationException::withMessages(['recipient' => ['You cannot message yourself.']]);
        }

        // Check if direct conversation already exists between these two
        $existing = Conversation::where('type', 'direct')
            ->whereHas('participants', fn($q) => $q->where('users.id', $senderId))
            ->whereHas('participants', fn($q) => $q->where('users.id', $recipientId))
            ->first();

        if ($existing) {
            return $existing;
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($senderId, $recipientId) {
            $conversation = Conversation::create([
                'type' => 'direct',
                'last_message_at' => now(),
            ]);

            $conversation->participants()->attach([$senderId, $recipientId]);

            return $conversation;
        });
    }
}
