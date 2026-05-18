<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    protected $fillable = [
        'name', 'username', 'full_name', 'phone_number',
        'email', 'phone', 'password', 'role', 'status',
        'avatar', 'is_onboarded', 'failed_login_attempts',
        'locked_until', 'last_login_at', 'last_login_ip',
        'two_factor_enabled', 'two_factor_secret',
        'stripe_customer_id', 'stripe_account_id',
    ];

    protected $hidden = [
        'password', 'remember_token', 'two_factor_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'locked_until'      => 'datetime',
        'last_login_at'     => 'datetime',
        'is_onboarded'      => 'boolean',
        'two_factor_enabled'=> 'boolean',
        'password'          => 'hashed',
    ];

    // ─── Role helpers ───────────────────────────────────────────────
    public function isInfluencer(): bool { return $this->role === 'influencer'; }
    public function isClient(): bool     { return $this->role === 'client'; }
    public function isAdmin(): bool      { return $this->role === 'admin'; }
    public function isActive(): bool     { return $this->status === 'active'; }
    public function isLocked(): bool     { return $this->locked_until && $this->locked_until->isFuture(); }

    // ─── Relationships ───────────────────────────────────────────────
    public function influencerProfile()
    {
        return $this->hasOne(InfluencerProfile::class);
    }

    public function clientProfile()
    {
        return $this->hasOne(ClientProfile::class);
    }

    public function campaigns()
    {
        return $this->hasMany(Campaign::class, 'client_id');
    }

    public function collaborationRequestsAsInfluencer()
    {
        return $this->hasMany(CollaborationRequest::class, 'influencer_id');
    }

    public function collaborationRequestsAsClient()
    {
        return $this->hasMany(CollaborationRequest::class, 'client_id');
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
                    ->withPivot('last_read_at', 'is_muted')
                    ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function reviewsGiven()
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'reviewee_id');
    }

    public function notifications_log()
    {
        return $this->hasMany(NotificationLog::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function verificationRequests()
    {
        return $this->hasMany(VerificationRequest::class);
    }
}
