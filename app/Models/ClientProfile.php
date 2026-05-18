<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClientProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'company_name', 'logo', 'description', 'industry',
        'company_size', 'website', 'country', 'city', 'social_links',
        'rating_avg', 'rating_count', 'total_campaigns',
    ];

    protected $casts = [
        'social_links' => 'array',
        'rating_avg'   => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
