<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\Concerns\IssuesPassportTokens;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\ShopStatus;
use ShopChain\Core\Enums\UserStatus;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;

class RegisterController extends Controller
{
    use IssuesPassportTokens;

    public function register(RegisterRequest $request)
    {
        $result = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => $request->password,
                'status' => UserStatus::Active,
            ]);

            $shop = Shop::create([
                'name' => $request->shop_name,
                'type' => 'retail',
                'owner_id' => $user->id,
                'status' => ShopStatus::Active,
            ]);

            ShopMember::create([
                'user_id' => $user->id,
                'shop_id' => $shop->id,
                'role' => ShopRole::Owner,
                'status' => MemberStatus::Active,
                'joined_at' => now(),
            ]);

            app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
            $user->assignRole('owner');

            Branch::create([
                'shop_id' => $shop->id,
                'name' => 'Main Branch',
                'is_default' => true,
            ]);

            return compact('user', 'shop');
        });

        $tokens = $this->issueTokens($request->email, $request->password);
        $this->createAuthSession($result['user'], $request);

        return response()->json([
            'user' => $result['user'],
            'shop' => $result['shop'],
            ...$tokens,
        ], 201);
    }
}
