<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id', 'sender_id', 'body', 'attachment_path',
        'attachment_type', 'type', 'metadata', 'is_flagged',
        'moderation_score', 'moderation_result', 'read_at',
    ];

    protected $casts = [
        'metadata'          => 'array',
        'moderation_result' => 'array',
        'is_flagged'        => 'boolean',
        'read_at'           => 'datetime',
        'moderation_score'  => 'float',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
