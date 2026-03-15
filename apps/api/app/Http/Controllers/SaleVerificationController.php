<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Resources\SaleVerificationResource;

class SaleVerificationController extends Controller
{
    public function __invoke(string $token): JsonResponse|SaleVerificationResource
    {
        $sale = Sale::withoutGlobalScopes()
            ->where('verify_token', $token)
            ->first();

        if (! $sale) {
            return response()->json(['message' => 'Receipt not found.'], 404);
        }

        $sale->load(['shop', 'branch', 'cashier', 'customer', 'items.product', 'payments']);

        return new SaleVerificationResource($sale);
    }
}
