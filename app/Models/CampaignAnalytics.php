<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CampaignAnalytics extends Model
{
    use HasFactory;

    protected $fillable = [
        'collaboration_request_id',
        'influencer_id',
        'campaign_id',
        'reach',
        'impressions',
        'likes',
        'comments',
        'shares',
        'clicks',
        'engagement_rate',
        'roi_estimate',
        'post_url',
        'reported_at',
    ];

    protected $casts = [
        'reported_at' => 'datetime',
    ];

    public function collaborationRequest()
    {
        return $this->belongsTo(CollaborationRequest::class);
    }

    public function influencer()
    {
        return $this->belongsTo(User::class, 'influencer_id');
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }
}
