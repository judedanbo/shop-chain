<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAnomalyStatusRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Enums\AnomalyStatus;
use ShopChain\Core\Models\Anomaly;
use ShopChain\Core\Models\Investigation;
use ShopChain\Core\Resources\AnomalyResource;
use ShopChain\Core\Services\AnomalyDetectionService;

class AnomalyController extends Controller
{
    public function __construct(private AnomalyDetectionService $anomalyService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.view'), 403);

        $anomalies = $this->anomalyService->listAnomalies(
            request()->only('severity', 'status', 'per_page')
        );

        return AnomalyResource::collection($anomalies)->response();
    }

    public function updateStatus(UpdateAnomalyStatusRequest $request, Anomaly $anomaly): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.audit.view'), 403);

        $status = AnomalyStatus::from($request->validated('status'));
        $anomaly = $this->anomalyService->updateStatus($anomaly, $status);

        return (new AnomalyResource($anomaly))->response();
    }

    public function linkToInvestigation(Anomaly $anomaly): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.view'), 403);

        request()->validate(['investigation_id' => ['required', 'uuid', 'exists:investigations,id']]);

        $investigation = Investigation::findOrFail(request()->input('investigation_id'));
        $anomaly = $this->anomalyService->linkToInvestigation($anomaly, $investigation);

        return (new AnomalyResource($anomaly))->response();
    }
}
