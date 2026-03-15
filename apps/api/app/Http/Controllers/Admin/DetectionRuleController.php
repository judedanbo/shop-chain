<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDetectionRuleRequest;
use App\Http\Requests\Admin\UpdateDetectionRuleRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Models\DetectionRule;
use ShopChain\Core\Resources\DetectionRuleResource;
use ShopChain\Core\Services\AnomalyDetectionService;

class DetectionRuleController extends Controller
{
    public function __construct(private AnomalyDetectionService $anomalyService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $rules = $this->anomalyService->listRules();

        return DetectionRuleResource::collection($rules)->response();
    }

    public function store(StoreDetectionRuleRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $rule = $this->anomalyService->createRule($request->validated());

        return (new DetectionRuleResource($rule))
            ->response()
            ->setStatusCode(201);
    }

    public function show(DetectionRule $detectionRule): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        return (new DetectionRuleResource($detectionRule))->response();
    }

    public function update(UpdateDetectionRuleRequest $request, DetectionRule $detectionRule): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $rule = $this->anomalyService->updateRule($detectionRule, $request->validated());

        return (new DetectionRuleResource($rule))->response();
    }

    public function destroy(DetectionRule $detectionRule): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $this->anomalyService->deleteRule($detectionRule);

        return response()->json(null, 204);
    }

    public function toggle(DetectionRule $detectionRule): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $rule = $this->anomalyService->toggleRule($detectionRule);

        return (new DetectionRuleResource($rule))->response();
    }
}
