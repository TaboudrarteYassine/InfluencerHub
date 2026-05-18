<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CollaborationRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'campaign_id', 'client_id', 'influencer_id', 'status',
        'proposed_amount', 'agreed_amount', 'message',
        'client_confirmed_at', 'influencer_confirmed_at',
        'agreed_at', 'completed_at', 'ai_match_score', 'ai_match_explanation',
    ];

    protected $casts = [
        'client_confirmed_at'     => 'datetime',
        'influencer_confirmed_at' => 'datetime',
        'agreed_at'               => 'datetime',
        'completed_at'            => 'datetime',
        'ai_match_explanation'    => 'array',
        'proposed_amount'         => 'float',
        'agreed_amount'           => 'float',
        'ai_match_score'          => 'float',
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function influencer()
    {
        return $this->belongsTo(User::class, 'influencer_id');
    }

    public function negotiations()
    {
        return $this->hasMany(Negotiation::class);
    }

    public function conversation()
    {
        return $this->hasOne(Conversation::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    public function analytics()
    {
        return $this->hasOne(CampaignAnalytics::class);
    }

    public function isBothConfirmed(): bool
    {
        return $this->client_confirmed_at && $this->influencer_confirmed_at;
    }
}
