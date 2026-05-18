<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'influencer_profile_id', 'platform', 'username', 'profile_url',
        'followers_count', 'engagement_rate', 'avg_likes', 'avg_comments',
        'avg_views', 'audience_demographics', 'fake_follower_score',
        'is_verified', 'last_synced_at',
    ];

    protected $casts = [
        'audience_demographics' => 'array',
        'is_verified'           => 'boolean',
        'last_synced_at'        => 'datetime',
        'engagement_rate'       => 'float',
        'fake_follower_score'   => 'float',
    ];

    public function influencerProfile()
    {
        return $this->belongsTo(InfluencerProfile::class);
    }

    public function isSuspiciouslyLowEngagement(): bool
    {
        if ($this->followers_count > 10000 && $this->engagement_rate < 0.5) {
            return true;
        }
        if ($this->followers_count > 100000 && $this->engagement_rate < 0.2) {
            return true;
        }
        return false;
    }
}
