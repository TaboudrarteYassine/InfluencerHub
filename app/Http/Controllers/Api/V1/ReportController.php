<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\User;
use App\Models\NotificationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'reported_user_id' => 'required|exists:users,id',
            'reason'           => 'required|string|in:Fake account or impersonation,Spam or misleading content,Inappropriate behavior in chat,Scam or fraud attempt,Fake followers or engagement,Other',
            'description'      => 'nullable|string|max:500',
        ]);

        $reporterId = $request->user()->id;
        $reportedId = $request->reported_user_id;

        if ($reporterId == $reportedId) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report yourself.'
            ], 422);
        }

        // Check for duplicate report in last 24 hours
        $recentReport = Report::where('reporter_id', $reporterId)
            ->where('reportable_type', User::class)
            ->where('reportable_id', $reportedId)
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->exists();

        if ($recentReport) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reported this user in the last 24 hours.'
            ], 429);
        }

        $report = Report::create([
            'reporter_id'     => $reporterId,
            'reportable_type' => User::class,
            'reportable_id'   => $reportedId,
            'reason'          => $request->reason,
            'description'     => $request->description,
            'status'          => 'pending',
        ]);

        // Notify admins
        $admins = User::role('admin')->get();
        foreach ($admins as $admin) {
            NotificationLog::create([
                'user_id' => $admin->id,
                'type'    => 'new_report',
                'title'   => 'New User Report Submitted',
                'body'    => "User ID {$reportedId} was reported for: {$request->reason}.",
                'action_url' => '/admin/reports',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Report submitted successfully. Our team will review it shortly.'
        ]);
    }
}
