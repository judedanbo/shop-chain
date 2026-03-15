<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\AdminShopResource;
use ShopChain\Core\Services\AdminShopService;

class ShopController extends Controller
{
    public function __construct(private AdminShopService $shopService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.shops.manage'), 403);

        $shops = $this->shopService->list(request()->only('status', 'search', 'per_page'));

        return AdminShopResource::collection($shops)->response();
    }

    public function show(Shop $shop): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.shops.manage'), 403);

        $shop = $this->shopService->show($shop);

        return (new AdminShopResource($shop))->response();
    }

    public function suspend(Shop $shop): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.shops.manage'), 403);

        $shop = $this->shopService->suspend($shop);

        return (new AdminShopResource($shop))->response();
    }

    public function reactivate(Shop $shop): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.shops.manage'), 403);

        $shop = $this->shopService->reactivate($shop);

        return (new AdminShopResource($shop))->response();
    }
}
