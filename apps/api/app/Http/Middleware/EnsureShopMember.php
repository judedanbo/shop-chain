<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Models\ShopMember;
use Symfony\Component\HttpFoundation\Response;

class EnsureShopMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $shop = $request->route('shop');

        $member = ShopMember::withoutGlobalScopes()
            ->where('user_id', $user->id)
            ->where('shop_id', $shop->id)
            ->where('status', MemberStatus::Active)
            ->first();

        if (! $member) {
            return response()->json([
                'message' => 'You are not an active member of this shop.',
            ], 403);
        }

        // Store member for downstream use
        $request->attributes->set('shop_member', $member);

        return $next($request);
    }
}
