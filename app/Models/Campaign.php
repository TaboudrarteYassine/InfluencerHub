<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id', 'category_id', 'title', 'slug', 'description',
        'deliverables', 'platforms', 'budget_min', 'budget_max',
        'deadline', 'country', 'target_niches', 'min_followers',
        'min_engagement_rate', 'status', 'ai_match_criteria', 'ai_match_score',
    ];

    protected $casts = [
        'platforms'        => 'array',
        'target_niches'    => 'array',
        'ai_match_criteria'=> 'array',
        'deadline'         => 'date',
        'budget_min'       => 'float',
        'budget_max'       => 'float',
        'ai_match_score'   => 'float',
    ];

    protected static function booted(): void
    {
        static::creating(function ($campaign) {
            $campaign->slug = Str::slug($campaign->title) . '-' . Str::random(6);
        });
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function clientProfile()
    {
        return $this->belongsTo(ClientProfile::class, 'client_id', 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function collaborationRequests()
    {
        return $this->hasMany(CollaborationRequest::class);
    }

    // ─── Scopes ─────────────────────────────────────────────────────
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'agreed', 'negotiating']);
    }

    public function scopeByBudget($query, ?float $min, ?float $max)
    {
        if ($min) $query->where('budget_max', '>=', $min);
        if ($max) $query->where('budget_min', '<=', $max);
        return $query;
    }
}
