<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'reporter_id', 'reportable_type', 'reportable_id',
        'reason', 'description', 'status', 'reviewed_by', 'admin_notes', 'reviewed_at',
    ];

    protected $casts = ['reviewed_at' => 'datetime'];

    public function reporter()   { return $this->belongsTo(User::class, 'reporter_id'); }
    public function reviewer()   { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function reportable() { return $this->morphTo(); }
}
