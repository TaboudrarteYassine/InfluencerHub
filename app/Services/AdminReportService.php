<?php

namespace App\Services;

use App\Models\Report;
use App\Models\ActivityLog;

class AdminReportService
{
    public function getReports(array $filters = [])
    {
        $query = Report::with(['reporter', 'reportable'])->latest();

        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function warnUser(int $reportId, int $adminId)
    {
        $report = Report::findOrFail($reportId);
        $report->update(['status' => 'reviewed']);
        
        // Simulating a warning notification
        \App\Models\NotificationLog::create([
            'user_id' => $report->reportable_id,
            'title' => 'Warning from Admin',
            'body' => 'Your account has been reported and reviewed. Please adhere to our terms of service.',
            'type' => 'warning',
            'is_read' => false,
        ]);

        $this->logAction($adminId, 'warn_user', $report);

        return $report;
    }

    public function dismissReport(int $reportId, int $adminId)
    {
        $report = Report::findOrFail($reportId);
        $report->update(['status' => 'dismissed']);
        $this->logAction($adminId, 'dismiss_report', $report);
        return $report;
    }

    public function resolveReport(int $reportId, int $adminId)
    {
        $report = Report::findOrFail($reportId);
        $report->update(['status' => 'resolved']);
        $this->logAction($adminId, 'resolve_report', $report);
        return $report;
    }

    private function logAction(int $adminId, string $action, Report $report)
    {
        ActivityLog::create([
            'user_id' => $adminId,
            'action' => $action,
            'entity_type' => 'report',
            'entity_id' => $report->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => ['reported_user' => $report->reportable_id],
        ]);
    }
}
