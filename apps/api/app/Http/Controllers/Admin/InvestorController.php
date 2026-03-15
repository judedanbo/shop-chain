<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMilestoneRequest;
use App\Http\Requests\Admin\UpdateMilestoneRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Models\Milestone;
use ShopChain\Core\Resources\MilestoneResource;
use ShopChain\Core\Services\InvestorService;
use ShopChain\Core\Services\MilestoneService;

class InvestorController extends Controller
{
    public function __construct(
        private InvestorService $investorService,
        private MilestoneService $milestoneService,
    ) {}

    public function engagement(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.investors.manage'), 403);

        return response()->json(['data' => $this->investorService->getEngagementMetrics()]);
    }

    public function funnel(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.investors.manage'), 403);

        return response()->json(['data' => $this->investorService->getConversionFunnel()]);
    }

    public function growth(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.investors.manage'), 403);

        return response()->json(['data' => $this->investorService->getGrowthMetrics()]);
    }

    public function cohortRetention(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.investors.manage'), 403);

        return response()->json(['data' => $this->investorService->getCohortRetention()]);
    }

    public function deck(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.investors.manage'), 403);

        return response()->json(['data' => $this->investorService->getDeckMetrics()]);
    }

    public function milestones(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.investors.manage'), 403);

        return MilestoneResource::collection($this->milestoneService->list())->response();
    }

    public function storeMilestone(StoreMilestoneRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.investors.manage'), 403);

        $milestone = $this->milestoneService->create($request->validated());

        return (new MilestoneResource($milestone))
            ->response()
            ->setStatusCode(201);
    }

    public function updateMilestone(UpdateMilestoneRequest $request, Milestone $milestone): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.investors.manage'), 403);

        $milestone = $this->milestoneService->update($milestone, $request->validated());

        return (new MilestoneResource($milestone))->response();
    }

    public function destroyMilestone(Milestone $milestone): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.investors.manage'), 403);

        $this->milestoneService->delete($milestone);

        return response()->json(null, 204);
    }
}
