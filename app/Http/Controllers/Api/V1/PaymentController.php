<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PaymentService;
use App\Models\CollaborationRequest;
use App\Models\Transaction;
use Stripe\StripeClient;
use Stripe\Exception\ApiErrorException;

class PaymentController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function createIntent(Request $request)
    {
        $request->validate([
            'collaboration_request_id' => 'required|exists:collaboration_requests,id',
        ]);

        $collab = CollaborationRequest::find($request->collaboration_request_id);

        if ($collab->client_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($collab->status !== 'agreed') {
            return response()->json(['message' => 'Collaboration is not in agreed status.'], 400);
        }

        // Check if pending transaction exists
        $existing = Transaction::where('collaboration_request_id', $collab->id)
            ->whereIn('status', ['pending', 'held'])
            ->first();

        if ($existing && $existing->status === 'held') {
            return response()->json(['message' => 'Payment already held in escrow.'], 400);
        }

        try {
            $data = $this->paymentService->createPaymentIntent($collab);
            return response()->json(['status' => 'success', 'data' => $data]);
        } catch (ApiErrorException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function releasePayment(Request $request, $transactionId)
    {
        $transaction = Transaction::findOrFail($transactionId);

        if ($transaction->client_id !== auth()->id() && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Usually released when campaign is completed
        if ($transaction->collaborationRequest->status !== 'completed' && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Campaign must be completed before releasing payment.'], 400);
        }

        try {
            $this->paymentService->releasePayment($transaction);
            return response()->json(['status' => 'success', 'message' => 'Payment released to influencer.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function refundPayment(Request $request, $transactionId)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can process refunds.'], 403);
        }

        $transaction = Transaction::findOrFail($transactionId);

        try {
            $this->paymentService->refundPayment($transaction);
            return response()->json(['status' => 'success', 'message' => 'Payment refunded to client.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function getTransaction($collaborationId)
    {
        $transaction = Transaction::where('collaboration_request_id', $collaborationId)->first();
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found.'], 404);
        }

        if ($transaction->client_id !== auth()->id() && $transaction->influencer_id !== auth()->id() && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['status' => 'success', 'data' => ['transaction' => $transaction]]);
    }

    public function getTransactions(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Transaction::with(['client', 'influencer', 'collaborationRequest.campaign']);
        
        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json(['status' => 'success', 'data' => ['transactions' => $query->orderBy('created_at', 'desc')->get()]]);
    }

    public function stripeOnboard()
    {
        $user = auth()->user();
        if ($user->role !== 'influencer') {
            return response()->json(['message' => 'Only influencers can onboard.'], 403);
        }

        try {
            $url = $this->paymentService->createInfluencerStripeAccount($user);
            return response()->json(['status' => 'success', 'data' => ['url' => $url]]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function stripeOnboardStatus()
    {
        $user = auth()->user();
        if (!$user->stripe_account_id) {
            return response()->json(['status' => 'success', 'data' => ['is_complete' => false]]);
        }

        if (str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
            $isComplete = true;
        } else {
            $stripe = new StripeClient(env('STRIPE_SECRET'));
            $account = $stripe->accounts->retrieve($user->stripe_account_id);
            $isComplete = $account->details_submitted && $account->charges_enabled;
        }

        return response()->json(['status' => 'success', 'data' => [
            'is_complete' => $isComplete,
            'total_earnings' => Transaction::where('influencer_id', $user->id)->where('status', 'released')->sum('influencer_amount'),
        ]]);
    }

    public function confirmMockPayment(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'nullable|string',
            'transaction_id' => 'nullable|integer',
        ]);

        if (!str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
            return response()->json(['message' => 'Not in mock mode.'], 400);
        }

        $paymentIntentId = $request->payment_intent_id;

        if (!$paymentIntentId && $request->transaction_id) {
            $transaction = Transaction::find($request->transaction_id);
            if ($transaction) {
                $paymentIntentId = $transaction->stripe_payment_intent_id;
            }
        }

        if (!$paymentIntentId) {
            return response()->json(['message' => 'The payment intent id or transaction id is required.'], 422);
        }

        $this->paymentService->confirmPayment($paymentIntentId);
        return response()->json(['status' => 'success', 'message' => 'Mock payment confirmed successfully.']);
    }
}
