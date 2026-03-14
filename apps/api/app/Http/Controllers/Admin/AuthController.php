<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Auth\Concerns\IssuesPassportTokens;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\TwoFactorVerifyRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Passport\RefreshToken;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Enums\UserStatus;

class AuthController extends Controller
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

        $adminUser = $user->adminUser;

        if (! $adminUser || $adminUser->status !== AdminTeamStatus::Active) {
            return response()->json([
                'message' => 'Admin access required.',
            ], 403);
        }

        if ($user->hasTwoFactorEnabled()) {
            $token = Str::random(64);

            Cache::put("2fa:admin:{$token}", [
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
        $adminUser->updateQuietly(['last_login_at' => now()]);

        return response()->json($tokens);
    }

    public function twoFactorVerify(TwoFactorVerifyRequest $request)
    {
        $cached = Cache::pull("2fa:admin:{$request->two_factor_token}");

        if (! $cached) {
            return response()->json([
                'message' => 'Invalid or expired two-factor token.',
            ], 401);
        }

        $user = User::findOrFail($cached['user_id']);
        $adminUser = $user->adminUser;

        if (! $adminUser || $adminUser->status !== AdminTeamStatus::Active) {
            return response()->json([
                'message' => 'Admin access required.',
            ], 403);
        }

        if (! $user->validateTwoFactorCode($request->code)) {
            return response()->json([
                'message' => 'Invalid two-factor code.',
            ], 422);
        }

        $password = decrypt($cached['password']);
        $tokens = $this->issueTokens($user->email, $password);
        $this->createAuthSession($user, $request);
        $adminUser->updateQuietly(['last_login_at' => now()]);

        return response()->json($tokens);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->token();
        $token->revoke();

        RefreshToken::where('access_token_id', $token->id)->update(['revoked' => true]);

        $request->user()->sessions()->where('is_current', true)->update([
            'is_current' => false,
            'expires_at' => now(),
        ]);

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
