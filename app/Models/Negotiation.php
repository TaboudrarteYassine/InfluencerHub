<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Negotiation extends Model
{
    protected $fillable = [
        'collaboration_request_id', 'sender_id', 'type', 'amount', 'message', 'terms',
    ];

    protected $casts = [
        'terms'  => 'array',
        'amount' => 'float',
    ];

    public function collaborationRequest()
    {
        return $this->belongsTo(CollaborationRequest::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    protected static function booted()
    {
        static::saved(function ($negotiation) {
            $collab = $negotiation->collaborationRequest;
            if ($collab) {
                \Illuminate\Support\Facades\Cache::forget("campaign:{$collab->campaign_id}");
            }
        });
    }
}
