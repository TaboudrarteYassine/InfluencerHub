<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedInfluencer extends Model
{
    protected $fillable = ['client_id', 'influencer_id'];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function influencer()
    {
        return $this->belongsTo(User::class, 'influencer_id');
    }

    public function influencerProfile()
    {
        return $this->hasOneThrough(
            InfluencerProfile::class,
            User::class,
            'id',          // FK on users
            'user_id',     // FK on influencer_profiles
            'influencer_id', // local key on saved_influencers
            'id'           // local key on users
        );
    }
}
