<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use ShopChain\Core\Services\SubscriptionService;

class PaystackWebhookController extends Controller
{
    public function __invoke(Request $request, SubscriptionService $subscriptionService): JsonResponse
    {
        // Verify signature
        $signature = $request->header('X-Paystack-Signature');
        $secret = config('services.paystack.secret');

        if (! $signature || ! $secret) {
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        $computed = hash_hmac('sha512', $request->getContent(), $secret);

        if (! hash_equals($computed, $signature)) {
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        $event = $request->input('event');
        $data = $request->input('data', []);
        $reference = $data['reference'] ?? null;

        if (! $reference) {
            return response()->json(['message' => 'OK']);
        }

        try {
            match ($event) {
                'charge.success' => $subscriptionService->handlePaymentSuccess($reference),
                'charge.failed' => $subscriptionService->handlePaymentFailure($reference),
                default => Log::info("Unhandled Paystack event: {$event}"),
            };
        } catch (\Throwable $e) {
            Log::error("Paystack webhook error: {$e->getMessage()}", [
                'event' => $event,
                'reference' => $reference,
            ]);
        }

        return response()->json(['message' => 'OK']);
    }
}
