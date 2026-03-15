<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Enums\UserStatus;
use ShopChain\Core\Resources\AdminUserDetailResource;
use ShopChain\Core\Services\AdminUserManagementService;

class UserController extends Controller
{
    public function __construct(private AdminUserManagementService $userService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.users.manage'), 403);

        $users = $this->userService->list(request()->only('status', 'search', 'per_page'));

        return AdminUserDetailResource::collection($users)->response();
    }

    public function show(User $user): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.users.manage'), 403);

        $user = $this->userService->show($user);

        return (new AdminUserDetailResource($user))->response();
    }

    public function updateStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.users.manage'), 403);

        $status = UserStatus::from($request->validated('status'));
        $user = $this->userService->updateStatus($user, $status);

        return (new AdminUserDetailResource($user))->response();
    }
}
