<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\KYCService;
use Illuminate\Http\JsonResponse;

class KYCController extends Controller
{
    protected $kycService;

    public function __construct(KYCService $kycService)
    {
        $this->kycService = $kycService;
    }

    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:191',
            'phone_number' => 'required|string|max:20',
            'username' => 'required|string|min:3|max:30|alpha_dash|unique:users,username,' . $request->user()->id,
            'cin_front' => 'required|image|max:5120',
            'selfie' => 'required|image|max:5120',
        ]);

        $this->kycService->submitKYC($request->user(), $validated);

        return response()->json(['message' => 'KYC submitted successfully.']);
    }

    public function status(Request $request): JsonResponse
    {
        $profile = $request->user()->influencerProfile;

        return response()->json([
            'status' => 'success',
            'data' => [
                'verification_status' => $profile->verification_status ?? 'not_submitted',
                'verification_note' => $profile->verification_note,
            ]
        ]);
    }

    public function resubmit(Request $request): JsonResponse
    {
        $profile = $request->user()->influencerProfile;

        if ($profile->verification_status !== 'rejected') {
            return response()->json(['message' => 'You can only resubmit if your previous submission was rejected.'], 400);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:191',
            'phone_number' => 'required|string|max:20',
            'username' => 'required|string|min:3|max:30|alpha_dash|unique:users,username,' . $request->user()->id,
            'cin_front' => 'required|image|max:5120',
            'selfie' => 'required|image|max:5120',
        ]);

        $this->kycService->submitKYC($request->user(), $validated);

        return response()->json(['message' => 'KYC resubmitted successfully.']);
    }
}
