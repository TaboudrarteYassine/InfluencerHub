<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PortfolioItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'media_url',
        'media_type',
        'external_url',
        'order'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
