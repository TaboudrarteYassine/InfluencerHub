<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'collaboration_request_id',
        'client_id',
        'influencer_id',
        'amount',
        'platform_commission',
        'influencer_amount',
        'currency',
        'status',
        'stripe_payment_intent_id',
        'stripe_transfer_id',
        'paid_at',
        'released_at',
        'refunded_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'released_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function collaborationRequest()
    {
        return $this->belongsTo(CollaborationRequest::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function influencer()
    {
        return $this->belongsTo(User::class, 'influencer_id');
    }
}
