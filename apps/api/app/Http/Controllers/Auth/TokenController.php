<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\Concerns\IssuesPassportTokens;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Passport\RefreshToken;

class TokenController extends Controller
{
    use IssuesPassportTokens;

    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $tokens = $this->refreshTokens($request->refresh_token);

        if (isset($tokens['error'])) {
            return response()->json([
                'message' => 'Invalid refresh token.',
            ], 401);
        }

        return response()->json($tokens);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->token();
        $token->revoke();

        // Revoke refresh tokens for this access token
        RefreshToken::where('access_token_id', $token->id)->update(['revoked' => true]);

        // Mark current session as expired
        $request->user()->sessions()->where('is_current', true)->update([
            'is_current' => false,
            'expires_at' => now(),
        ]);

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['shopMembers.shop', 'adminUser']);

        return response()->json([
            'user' => $user,
            'two_factor_enabled' => $user->hasTwoFactorEnabled(),
            'is_admin' => $user->adminUser !== null && $user->adminUser->status->value === 'active',
        ]);
    }
}
