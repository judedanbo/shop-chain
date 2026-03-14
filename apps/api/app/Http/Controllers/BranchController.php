<?php

namespace App\Http\Controllers;

use App\Http\Requests\Branch\CreateBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\BranchResource;
use ShopChain\Core\Services\BranchService;

class BranchController extends Controller
{
    public function __construct(private BranchService $branchService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Branch::class);

        $branches = $shop->branches()
            ->withCount('members')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return BranchResource::collection($branches)->response();
    }

    public function store(CreateBranchRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Branch::class);

        $branch = $this->branchService->createBranch($shop, $request->validated());

        return (new BranchResource($branch))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, Branch $branch): JsonResponse
    {
        $this->authorize('view', $branch);

        $branch->loadCount('members');

        return (new BranchResource($branch))->response();
    }

    public function update(UpdateBranchRequest $request, Shop $shop, Branch $branch): JsonResponse
    {
        $this->authorize('update', $branch);

        $branch = $this->branchService->updateBranch($branch, $request->validated());

        return (new BranchResource($branch))->response();
    }

    public function destroy(Request $request, Shop $shop, Branch $branch): JsonResponse
    {
        $this->authorize('delete', $branch);

        $this->branchService->deleteBranch($branch);

        return response()->json(null, 204);
    }
}
