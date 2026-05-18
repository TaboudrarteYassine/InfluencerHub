<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    protected $fillable = ['ip_address', 'reason', 'blocked_by'];

    public function blocker()
    {
        return $this->belongsTo(User::class, 'blocked_by');
    }
}
