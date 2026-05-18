<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InfluencerProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'display_name', 'bio', 'profile_picture', 'cover_image',
        'country', 'city', 'languages', 'niches', 'price_min', 'price_max',
        'availability', 'is_verified', 'trust_score', 'rating_avg',
        'rating_count', 'completed_campaigns', 'response_time_hours',
        'fake_follower_flags', 'cin_front_url', 'selfie_url',
        'verification_status', 'verification_note', 'verified_at',
        'submitted_at',
    ];

    protected $casts = [
        'languages'           => 'array',
        'niches'              => 'array',
        'fake_follower_flags' => 'array',
        'is_verified'         => 'boolean',
        'trust_score'         => 'float',
        'rating_avg'          => 'decimal:2',
        'price_min'           => 'decimal:2',
        'price_max'           => 'decimal:2',
        'verified_at'         => 'datetime',
        'submitted_at'        => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function portfolioItems()
    {
        return $this->hasMany(PortfolioItem::class, 'user_id', 'user_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────
    public function scopeAvailable($query)
    {
        return $query->where('availability', 'available');
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeByTrustScore($query, float $min = 0)
    {
        return $query->where('trust_score', '>=', $min);
    }
}
