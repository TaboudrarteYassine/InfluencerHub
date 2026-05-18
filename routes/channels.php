<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Assuming there are chat channels here as well based on previous prompt, but since I am creating the file, I should just put the notification channel.
// Wait, if Chat is working, there must be a chat channel somewhere. Let me check if broadcasting is defined somewhere else.
