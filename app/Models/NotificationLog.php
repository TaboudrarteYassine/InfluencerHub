<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    protected $table    = 'notifications_log';
    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'data', 'action_url', 'is_read', 'read_at',
    ];
    protected $casts = [
        'data'    => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }

    protected static function booted()
    {
        static::created(function ($notification) {
            broadcast(new \App\Events\NotificationSent($notification));
        });
    }
}
