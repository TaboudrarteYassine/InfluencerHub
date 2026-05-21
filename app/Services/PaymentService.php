<?php

namespace App\Services;

use Stripe\StripeClient;
use App\Models\Transaction;
use App\Models\CollaborationRequest;
use App\Models\User;
use App\Models\ActivityLog;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(env('STRIPE_SECRET'));
    }

    public function getCommissionPercent(): float
    {
        return (float) env('STRIPE_COMMISSION_PERCENT', 10);
    }

    public function createPaymentIntent(CollaborationRequest $collab): array
    {
        $commissionPercent = $this->getCommissionPercent();
        $amount = $collab->agreed_amount;
        $commission = $amount * ($commissionPercent / 100);
        $influencerAmount = $amount - $commission;

        // Create a PaymentIntent with the order amount and currency
        if (str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
            $paymentIntentId = 'pi_mock_' . strtolower(str_replace(' ', '_', $collab->campaign->title)) . '_' . time();
            $paymentIntent = (object) [
                'id' => $paymentIntentId,
                'client_secret' => 'pi_mock_secret_' . time(),
            ];
        } else {
            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => $amount * 100, // Amount in cents
                'currency' => 'mad', // Assuming MAD
                'metadata' => [
                    'collaboration_request_id' => $collab->id,
                ],
                // In a real scenario, you'd specify application_fee_amount and transfer_data if using Destination Charges
            ]);
        }

        $transaction = Transaction::create([
            'collaboration_request_id' => $collab->id,
            'client_id' => $collab->client_id,
            'influencer_id' => $collab->influencer_id,
            'amount' => $amount,
            'platform_commission' => $commission,
            'influencer_amount' => $influencerAmount,
            'currency' => 'MAD',
            'status' => 'pending',
            'stripe_payment_intent_id' => $paymentIntent->id,
        ]);

        return [
            'client_secret' => $paymentIntent->client_secret,
            'transaction_id' => $transaction->id,
            'amount' => $amount,
            'commission' => $commission,
            'influencer_amount' => $influencerAmount,
            'stripe_payment_intent_id' => $paymentIntent->id,
        ];
    }

    public function confirmPayment(string $paymentIntentId): void
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntentId)->first();
        if (!$transaction || $transaction->status !== 'pending') return;

        $transaction->update([
            'status' => 'held',
            'paid_at' => now(),
        ]);

        $collab = $transaction->collaborationRequest;
        $collab->update(['status' => 'active']);

        // Notifications
        NotificationLog::create([
            'user_id' => $collab->influencer_id,
            'type' => 'payment_held',
            'title' => 'Payment Secured',
            'body' => "The client has deposited the payment for {$collab->campaign->title}. You can start working now.",
            'is_read' => false,
        ]);

        NotificationLog::create([
            'user_id' => $collab->client_id,
            'type' => 'payment_held',
            'title' => 'Payment Successful',
            'body' => "Your payment for {$collab->campaign->title} is now safely held in escrow.",
            'is_read' => false,
        ]);
        
        // Activity log
        ActivityLog::create([
            'user_id' => $collab->client_id,
            'action' => 'payment_deposited',
            'entity_type' => 'transaction',
            'entity_id' => $transaction->id,
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'system',
            'metadata' => ['amount' => $transaction->amount],
        ]);
    }

    public function releasePayment(Transaction $transaction): bool
    {
        if ($transaction->status !== 'held') {
            throw new \Exception('Transaction is not held in escrow.');
        }

        $influencer = $transaction->influencer;
        if (!$influencer->stripe_account_id) {
            if (str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
                $influencer->update(['stripe_account_id' => 'acct_mock_' . time()]);
            } else {
                throw new \Exception('Influencer has not connected a Stripe account.');
            }
        }

        try {
            if (str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
                $transfer = (object) ['id' => 'tr_mock_' . time()];
            } else {
                $transfer = $this->stripe->transfers->create([
                    'amount' => $transaction->influencer_amount * 100, // cents
                    'currency' => strtolower($transaction->currency),
                    'destination' => $influencer->stripe_account_id,
                    'transfer_group' => 'collab_' . $transaction->collaboration_request_id,
                ]);
            }

            $transaction->update([
                'status' => 'released',
                'stripe_transfer_id' => $transfer->id,
                'released_at' => now(),
            ]);

            ActivityLog::create([
                'user_id' => $transaction->client_id,
                'action' => 'payment_released',
                'entity_type' => 'transaction',
                'entity_id' => $transaction->id,
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'system',
                'metadata' => ['amount' => $transaction->influencer_amount],
            ]);

            NotificationLog::create([
                'user_id' => $transaction->influencer_id,
                'type' => 'payment_released',
                'title' => 'Payment Released',
                'body' => "Funds for {$transaction->collaborationRequest->campaign->title} have been released to your Stripe account.",
                'is_read' => false,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Stripe Transfer Failed: ' . $e->getMessage());
            return false;
        }
    }

    public function refundPayment(Transaction $transaction): bool
    {
        if ($transaction->status !== 'held') {
            throw new \Exception('Transaction cannot be refunded.');
        }

        try {
            if (str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
                $refund = (object) ['id' => 're_mock_' . time()];
            } else {
                $this->stripe->refunds->create([
                    'payment_intent' => $transaction->stripe_payment_intent_id,
                ]);
            }

            $transaction->update([
                'status' => 'refunded',
                'refunded_at' => now(),
            ]);

            ActivityLog::create([
                'user_id' => auth()->id() ?? $transaction->client_id,
                'action' => 'payment_refunded',
                'entity_type' => 'transaction',
                'entity_id' => $transaction->id,
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'system',
            ]);

            NotificationLog::create([
                'user_id' => $transaction->client_id,
                'type' => 'payment_refunded',
                'title' => 'Payment Refunded',
                'body' => "Your payment for {$transaction->collaborationRequest->campaign->title} has been refunded.",
                'is_read' => false,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Stripe Refund Failed: ' . $e->getMessage());
            return false;
        }
    }

    public function createInfluencerStripeAccount(User $user): string
    {
        if (!$user->stripe_account_id) {
            if (str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
                $user->update(['stripe_account_id' => 'acct_mock_' . time()]);
            } else {
                $account = $this->stripe->accounts->create([
                    'type' => 'express',
                    'country' => 'MA', // Morocco
                    'email' => $user->email,
                    'capabilities' => [
                        'transfers' => ['requested' => true],
                    ],
                ]);
                $user->update(['stripe_account_id' => $account->id]);
            }
        }

        if (str_starts_with(env('STRIPE_SECRET', ''), 'sk_test_xxx')) {
            return config('app.url') . '/settings/influencer?stripe=return';
        }

        $accountLink = $this->stripe->accountLinks->create([
            'account' => $user->stripe_account_id,
            'refresh_url' => config('app.url') . '/settings/influencer?stripe=refresh',
            'return_url' => config('app.url') . '/settings/influencer?stripe=return',
            'type' => 'account_onboarding',
        ]);

        return $accountLink->url;
    }
}
