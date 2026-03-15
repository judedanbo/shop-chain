<?php

namespace App\Http\Controllers;

use App\Http\Requests\Team\AssignBranchesRequest;
use App\Http\Requests\Team\ChangeRoleRequest;
use App\Http\Requests\Team\InviteTeamMemberRequest;
use App\Http\Requests\Team\UpdateStatusRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;
use ShopChain\Core\Resources\ShopMemberResource;
use ShopChain\Core\Services\TeamService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TeamController extends Controller
{
    public function __construct(private TeamService $teamService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', ShopMember::class);

        $members = QueryBuilder::for(ShopMember::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('role'),
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->whereHas('user', fn ($q) => $q->where('name', 'ilike', "%{$value}%")
                        ->orWhere('email', 'ilike', "%{$value}%"));
                }),
            ])
            ->allowedSorts(['created_at', 'joined_at'])
            ->with(['user', 'branches'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return ShopMemberResource::collection($members)->response();
    }

    public function show(Request $request, Shop $shop, ShopMember $member): JsonResponse
    {
        $this->authorize('view', $member);

        $member->load(['user', 'branches']);

        return (new ShopMemberResource($member))->response();
    }

    public function invite(InviteTeamMemberRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', ShopMember::class);

        $member = $this->teamService->inviteMember($shop, $request->user(), $request->validated());

        return (new ShopMemberResource($member))
            ->response()
            ->setStatusCode(201);
    }

    public function changeRole(ChangeRoleRequest $request, Shop $shop, ShopMember $member): JsonResponse
    {
        $this->authorize('updateRole', $member);

        $newRole = ShopRole::from($request->validated('role'));

        $member = $this->teamService->changeRole($member, $newRole, $request->user());

        return (new ShopMemberResource($member))->response();
    }

    public function updateStatus(UpdateStatusRequest $request, Shop $shop, ShopMember $member): JsonResponse
    {
        $this->authorize('updateStatus', $member);

        $newStatus = MemberStatus::from($request->validated('status'));

        $member = $this->teamService->updateStatus($member, $newStatus, $request->user());

        return (new ShopMemberResource($member))->response();
    }

    public function assignBranches(AssignBranchesRequest $request, Shop $shop, ShopMember $member): JsonResponse
    {
        $this->authorize('assignBranches', $member);

        $member = $this->teamService->assignBranches($member, $request->validated('branch_ids'));

        return (new ShopMemberResource($member))->response();
    }

    public function resendInvite(Request $request, Shop $shop, ShopMember $member): JsonResponse
    {
        $this->authorize('create', ShopMember::class);

        $member = $this->teamService->resendInvite($member, $request->user());

        return (new ShopMemberResource($member))->response();
    }

    public function cancelInvite(Request $request, Shop $shop, ShopMember $member): JsonResponse
    {
        $this->authorize('create', ShopMember::class);

        $this->teamService->cancelInvite($member, $request->user());

        return response()->json(null, 204);
    }

    public function destroy(Request $request, Shop $shop, ShopMember $member): JsonResponse
    {
        $this->authorize('delete', $member);

        $this->teamService->removeMember($member, $request->user());

        return response()->json(null, 204);
    }
}
