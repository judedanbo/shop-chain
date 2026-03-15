<?php

namespace ShopChain\Core\Services;

use Illuminate\Support\Facades\Http;

class PaystackService
{
    private string $baseUrl = 'https://api.paystack.co';

    private function secretKey(): string
    {
        return config('services.paystack.secret');
    }

    /**
     * Initialize a transaction.
     *
     * @return array{authorization_url: string, access_code: string, reference: string}
     */
    public function initializeTransaction(string $email, int $amount, string $reference, string $callbackUrl, array $channels = ['card', 'mobile_money']): array
    {
        $response = Http::withToken($this->secretKey())
            ->post("{$this->baseUrl}/transaction/initialize", [
                'email' => $email,
                'amount' => $amount,
                'reference' => $reference,
                'callback_url' => $callbackUrl,
                'channels' => $channels,
            ]);

        return $response->throw()->json('data');
    }

    /**
     * Verify a transaction by reference.
     *
     * @return array{status: string, amount: int, authorization: array}
     */
    public function verifyTransaction(string $reference): array
    {
        $response = Http::withToken($this->secretKey())
            ->get("{$this->baseUrl}/transaction/verify/{$reference}");

        return $response->throw()->json('data');
    }

    /**
     * Charge an authorization (recurring payment).
     */
    public function chargeAuthorization(string $authCode, string $email, int $amount, string $reference): array
    {
        $response = Http::withToken($this->secretKey())
            ->post("{$this->baseUrl}/transaction/charge_authorization", [
                'authorization_code' => $authCode,
                'email' => $email,
                'amount' => $amount,
                'reference' => $reference,
            ]);

        return $response->throw()->json('data');
    }

    /**
     * Refund a transaction.
     */
    public function refundTransaction(string $reference, ?int $amount = null): array
    {
        $payload = ['transaction' => $reference];

        if ($amount !== null) {
            $payload['amount'] = $amount;
        }

        $response = Http::withToken($this->secretKey())
            ->post("{$this->baseUrl}/refund", $payload);

        return $response->throw()->json('data');
    }
}
