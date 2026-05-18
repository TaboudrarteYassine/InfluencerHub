<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class StripeWebhookService
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function handleWebhook(array $payload)
    {
        $type = $payload['type'] ?? '';

        switch ($type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($payload['data']['object']);
                break;
            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($payload['data']['object']);
                break;
            case 'transfer.created':
                $this->handleTransferCreated($payload['data']['object']);
                break;
            default:
                Log::info("Unhandled Stripe webhook event type: $type");
        }
    }

    protected function handlePaymentIntentSucceeded(array $paymentIntent)
    {
        $this->paymentService->confirmPayment($paymentIntent['id']);
    }

    protected function handlePaymentIntentFailed(array $paymentIntent)
    {
        $transaction = \App\Models\Transaction::where('stripe_payment_intent_id', $paymentIntent['id'])->first();
        if ($transaction && $transaction->status === 'pending') {
            $transaction->update(['status' => 'failed']);
            Log::info("Payment failed for transaction {$transaction->id}");
        }
    }

    protected function handleTransferCreated(array $transfer)
    {
        // Handled synchronously in PaymentService currently, but log just in case
        Log::info("Stripe transfer created: " . $transfer['id']);
    }
}
