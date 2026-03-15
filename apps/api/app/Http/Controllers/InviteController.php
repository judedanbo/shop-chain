<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Auth\Concerns\IssuesPassportTokens;
use App\Http\Requests\Invite\AcceptInviteRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Models\ShopMember;
use ShopChain\Core\Resources\ShopMemberResource;
use ShopChain\Core\Services\TeamService;

class InviteController extends Controller
{
    use IssuesPassportTokens;

    public function __construct(private TeamService $teamService) {}

    public function show(string $token): JsonResponse
    {
        $member = ShopMember::withoutGlobalScopes()
            ->with(['user', 'inviter'])
            ->where('invite_token', $token)
            ->first();

        if (! $member) {
            return response()->json(['message' => 'Invitation not found.'], 404);
        }

        if ($member->status !== MemberStatus::Invited || $member->isInviteExpired()) {
            return response()->json(['message' => 'This invitation is no longer valid.'], 410);
        }

        $shop = \ShopChain\Core\Models\Shop::withoutGlobalScopes()->find($member->shop_id);

        return response()->json([
            'shop_name' => $shop->name,
            'role' => $member->role,
            'email' => $member->user->email,
            'inviter_name' => $member->inviter?->name,
            'expires_at' => $member->invite_expires_at,
            'requires_password' => $member->user->last_active_at === null,
        ]);
    }

    public function accept(AcceptInviteRequest $request, string $token): JsonResponse
    {
        $result = $this->teamService->acceptInvite($token, $request->validated('password'));

        $data = [
            'member' => new ShopMemberResource($result['member']),
            'user' => $result['user'],
        ];

        if ($result['is_new_user']) {
            $tokens = $this->issueTokens($result['user']->email, $request->validated('password'));
            $this->createAuthSession($result['user'], $request);

            return response()->json([...$data, ...$tokens], 201);
        }

        return response()->json($data);
    }
}
