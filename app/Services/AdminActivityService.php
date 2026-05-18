<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminActivityService
{
    public function listLogs(array $filters): LengthAwarePaginator
    {
        $query = ActivityLog::with('user:id,name');

        if (!empty($filters['admin_name'])) {
            $query->whereHas('user', function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['admin_name'] . '%');
            });
        }

        if (!empty($filters['action']) && $filters['action'] !== 'all') {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        return $query->orderByDesc('created_at')->paginate($filters['per_page'] ?? 20);
    }
}
