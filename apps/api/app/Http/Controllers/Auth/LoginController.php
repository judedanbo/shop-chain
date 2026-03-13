<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\Concerns\IssuesPassportTokens;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use ShopChain\Core\Enums\UserStatus;

class LoginController extends Controller
{
    use IssuesPassportTokens;

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->status !== UserStatus::Active) {
            return response()->json([
                'message' => 'Your account is not active.',
            ], 403);
        }

        if ($user->hasTwoFactorEnabled()) {
            $token = Str::random(64);

            Cache::put("2fa:{$token}", [
                'user_id' => $user->id,
                'password' => encrypt($request->password),
            ], now()->addMinutes(10));

            return response()->json([
                'two_factor_required' => true,
                'two_factor_token' => $token,
            ]);
        }

        $tokens = $this->issueTokens($request->email, $request->password);
        $this->createAuthSession($user, $request);

        return response()->json($tokens);
    }
}
