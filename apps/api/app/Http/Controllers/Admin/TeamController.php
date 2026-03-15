<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InviteAdminRequest;
use App\Http\Requests\Admin\UpdateAdminRoleRequest;
use App\Http\Requests\Admin\UpdateAdminStatusRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;
use ShopChain\Core\Resources\AdminUserResource;
use ShopChain\Core\Services\AdminTeamService;

class TeamController extends Controller
{
    public function __construct(private AdminTeamService $adminTeamService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.team.manage'), 403);

        $adminUsers = $this->adminTeamService->list(request()->only('role', 'status', 'search', 'per_page'));

        return AdminUserResource::collection($adminUsers)->response();
    }

    public function show(AdminUser $adminUser): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.team.manage'), 403);

        $adminUser = $this->adminTeamService->show($adminUser);

        return (new AdminUserResource($adminUser))->response();
    }

    public function invite(InviteAdminRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.team.manage'), 403);

        $adminUser = $this->adminTeamService->invite($request->user(), $request->validated());

        return (new AdminUserResource($adminUser))
            ->response()
            ->setStatusCode(201);
    }

    public function updateRole(UpdateAdminRoleRequest $request, AdminUser $adminUser): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.team.manage'), 403);

        $role = AdminRole::from($request->validated('role'));
        $adminUser = $this->adminTeamService->updateRole($adminUser, $role);

        return (new AdminUserResource($adminUser))->response();
    }

    public function updateStatus(UpdateAdminStatusRequest $request, AdminUser $adminUser): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.team.manage'), 403);

        $status = AdminTeamStatus::from($request->validated('status'));
        $adminUser = $this->adminTeamService->updateStatus($adminUser, $status);

        return (new AdminUserResource($adminUser))->response();
    }

    public function destroy(AdminUser $adminUser): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.team.manage'), 403);

        $this->adminTeamService->remove($adminUser);

        return response()->json(null, 204);
    }
}
