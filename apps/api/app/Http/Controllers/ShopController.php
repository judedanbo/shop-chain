<?php

namespace App\Http\Controllers;

use App\Http\Requests\Shop\CreateShopRequest;
use App\Http\Requests\Shop\UpdateShopRequest;
use App\Http\Requests\Shop\UpdateShopSettingsRequest;
use App\Http\Requests\Shop\UploadShopLogoRequest;
use App\Services\PlanEnforcementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\ShopResource;
use ShopChain\Core\Resources\ShopSettingsResource;
use ShopChain\Core\Services\ShopService;

class ShopController extends Controller
{
    public function __construct(private ShopService $shopService) {}

    public function index(Request $request): JsonResponse
    {
        $shops = $request->user()
            ->shops()
            ->withCount(['branches', 'members'])
            ->get();

        return ShopResource::collection($shops)->response();
    }

    public function store(CreateShopRequest $request): JsonResponse
    {
        $user = $request->user();

        // Plan check inline — no {shop} route param so enforce_plan middleware can't be used
        $existingShop = $user->ownedShops()->first();

        if ($existingShop) {
            $service = app(PlanEnforcementService::class);

            if (! $service->canAdd($existingShop, 'shops')) {
                $plan = $existingShop->activePlan;

                return response()->json([
                    'message' => "Your {$plan->name} plan limit for shops has been reached.",
                    'limit' => 'shops',
                    'max' => $plan->limits['shops'] ?? 0,
                    'plan' => $plan->id,
                ], 403);
            }
        }

        $shop = $this->shopService->createShop($user, $request->validated());

        return (new ShopResource($shop))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('view', $shop);

        $shop->loadCount(['branches', 'members']);

        return (new ShopResource($shop))->response();
    }

    public function update(UpdateShopRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('update', $shop);

        $shop = $this->shopService->updateShop($shop, $request->validated());
        $shop->loadCount(['branches', 'members']);

        return (new ShopResource($shop))->response();
    }

    public function destroy(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('delete', $shop);

        $this->shopService->deleteShop($shop);

        return response()->json(null, 204);
    }

    public function settings(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('view', $shop);

        return (new ShopSettingsResource($shop))->response();
    }

    public function updateSettings(UpdateShopSettingsRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('updateSettings', $shop);

        $shop = $this->shopService->updateSettings($shop, $request->validated());

        return (new ShopSettingsResource($shop))->response();
    }

    public function uploadLogo(UploadShopLogoRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('uploadLogo', $shop);

        $this->shopService->uploadLogo($shop, $request->file('logo'));

        $shop->refresh()->loadCount(['branches', 'members']);

        return (new ShopResource($shop))->response();
    }

    public function deleteLogo(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('deleteLogo', $shop);

        $this->shopService->deleteLogo($shop);

        return response()->json(null, 204);
    }

    public function planUsage(Request $request, Shop $shop): JsonResponse
    {
        $member = $request->attributes->get('shop_member');
        $service = app(PlanEnforcementService::class);

        return response()->json([
            'plan' => $shop->activePlan->only(['id', 'name', 'price', 'features']),
            'usage' => $service->computeUsage($shop),
            'is_decision_maker' => in_array($member->role, [
                ShopRole::Owner,
                ShopRole::GeneralManager,
                ShopRole::Manager,
            ]),
        ]);
    }
}
