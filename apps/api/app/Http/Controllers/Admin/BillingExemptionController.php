<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GrantExemptionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\BillingExemption;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\BillingExemptionResource;
use ShopChain\Core\Services\BillingExemptionService;

class BillingExemptionController extends Controller
{
    public function __construct(private BillingExemptionService $exemptionService) {}

    public function index(Shop $shop): JsonResponse
    {
        $exemptions = BillingExemption::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->with('grantedBy')
            ->latest()
            ->get();

        return BillingExemptionResource::collection($exemptions)->response();
    }

    public function store(GrantExemptionRequest $request, Shop $shop): JsonResponse
    {
        $exemption = $this->exemptionService->grant(
            $shop,
            $request->user(),
            $request->validated(),
        );

        $exemption->load('grantedBy');

        return (new BillingExemptionResource($exemption))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Shop $shop, BillingExemption $exemption): JsonResponse
    {
        $exemption->update($request->only(['reason', 'expires_at']));

        return (new BillingExemptionResource($exemption->refresh()->load('grantedBy')))->response();
    }

    public function destroy(Shop $shop, BillingExemption $exemption): JsonResponse
    {
        $this->exemptionService->revoke($exemption);

        return response()->json(null, 204);
    }
}
