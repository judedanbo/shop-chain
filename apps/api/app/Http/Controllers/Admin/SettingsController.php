<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePlatformSettingsRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Services\PlatformSettingsService;

class SettingsController extends Controller
{
    public function __construct(private PlatformSettingsService $settingsService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.settings.manage'), 403);

        return response()->json(['data' => $this->settingsService->all()]);
    }

    public function update(UpdatePlatformSettingsRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.settings.manage'), 403);

        $settings = $this->settingsService->update($request->validated());

        return response()->json(['data' => $settings]);
    }

    public function reset(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.settings.manage'), 403);

        $settings = $this->settingsService->reset();

        return response()->json(['data' => $settings]);
    }
}
