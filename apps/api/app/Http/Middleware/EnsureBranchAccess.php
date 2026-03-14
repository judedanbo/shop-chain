<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\BranchMember;
use Symfony\Component\HttpFoundation\Response;

class EnsureBranchAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $branch = $request->route('branch');

        if (! $branch) {
            return $next($request);
        }

        $member = $request->attributes->get('shop_member');

        // Decision-makers bypass branch check
        if (in_array($member->role, [
            ShopRole::Owner,
            ShopRole::GeneralManager,
            ShopRole::Manager,
        ])) {
            return $next($request);
        }

        // Non-decision-makers must be assigned to this branch
        $hasAccess = BranchMember::where('member_id', $member->id)
            ->where('branch_id', $branch->id)
            ->exists();

        if (! $hasAccess) {
            return response()->json([
                'message' => 'You do not have access to this branch.',
            ], 403);
        }

        return $next($request);
    }
}
