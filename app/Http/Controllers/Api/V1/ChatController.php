<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ChatService;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(
        private readonly ChatService $chatService,
        private readonly \App\Services\MediaService $mediaService
    ) {}

    public function conversations(Request $request): JsonResponse
    {
        $conversations = $request->user()
            ->conversations()
            ->with(['lastMessage.sender:id,name,avatar', 'participants:id,name,avatar'])
            ->orderBy('last_message_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    public function startDirect(Request $request): JsonResponse
    {
        $request->validate(['recipient_id' => 'required|exists:users,id']);
        $conversation = $this->chatService->startDirectConversation(
            $request->user()->id, 
            $request->input('recipient_id')
        );

        return response()->json([
            'success' => true,
            'data' => ['conversation' => $conversation]
        ], 201);
    }

    public function messages(Request $request, int $conversationId): JsonResponse
    {
        $messages = $this->chatService->getMessages($conversationId, $request->user()->id);
        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function send(Request $request, int $conversationId): JsonResponse
    {
        $validated = $request->validate([
            'body'       => 'nullable|string|max:5000',
            'attachment' => 'nullable|file|max:10240',
            'type'       => 'sometimes|in:text,image,file,offer',
            'metadata'   => 'nullable|array',
        ]);

        $message = $this->chatService->sendMessage(
            $conversationId,
            $request->user()->id,
            array_merge($validated, [
                'attachment' => $request->file('attachment'),
            ])
        );

        return response()->json([
            'success' => true,
            'message' => 'Message sent.',
            'data'    => ['message' => $message->load('sender:id,name,avatar')],
        ], 201);
    }

    public function markRead(Request $request, int $conversationId): JsonResponse
    {
        $this->chatService->markAsRead($conversationId, $request->user()->id);
        return response()->json(['success' => true, 'message' => 'Messages marked as read.']);
    }

    public function typing(Request $request, int $conversationId): JsonResponse
    {
        $request->validate(['is_typing' => 'required|boolean']);
        $this->chatService->broadcastTyping($conversationId, $request->user()->id, $request->boolean('is_typing'));
        return response()->json(['success' => true]);
    }

    public function uploadAttachment(Request $request): JsonResponse
    {
        $request->validate([
            'file'            => 'required|file|max:10240',
            'conversation_id' => 'required|exists:conversations,id'
        ]);

        $conversationId = $request->input('conversation_id');
        
        // Ensure user is participant
        $conversation = \App\Models\Conversation::with('participants')->findOrFail($conversationId);
        if (!$conversation->participants->contains('id', $request->user()->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $fileData = $this->mediaService->uploadChatAttachment($request->file('file'), $conversationId);
        
        $message = \App\Models\Message::create([
            'conversation_id' => $conversationId,
            'sender_id'       => $request->user()->id,
            'attachment_path' => $fileData['url'],
            'attachment_type' => $fileData['type'],
            'type'            => $fileData['type'] === 'image' ? 'image' : 'file',
            'metadata'        => [
                'original_name' => $fileData['original_name'],
                'size'          => $fileData['size'],
            ]
        ]);

        $conversation->update(['last_message_at' => now()]);
        broadcast(new \App\Events\MessageSent($message->load('sender:id,name,avatar')))->toOthers();

        return response()->json([
            'success' => true,
            'data'    => [
                'url'  => $fileData['url'],
                'type' => $fileData['type'],
                'name' => $fileData['original_name'],
                'size' => $fileData['size'],
                'message' => $message->load('sender:id,name,avatar')
            ]
        ]);
    }
}
