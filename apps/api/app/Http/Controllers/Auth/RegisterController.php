<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\Concerns\IssuesPassportTokens;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use ShopChain\Core\Enums\UserStatus;
use ShopChain\Core\Services\ShopService;

class RegisterController extends Controller
{
    use IssuesPassportTokens;

    public function __construct(private ShopService $shopService) {}

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

            $shop = $this->shopService->createShop($user, [
                'name' => $request->shop_name,
                'type' => 'retail',
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
