<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Auth\Concerns\IssuesPassportTokens;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactorVerifyRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class TwoFactorController extends Controller
{
    use IssuesPassportTokens;

    /**
     * Verify 2FA code during login (unauthenticated).
     */
    public function verify(TwoFactorVerifyRequest $request)
    {
        $cached = Cache::pull("2fa:{$request->two_factor_token}");

        if (! $cached) {
            return response()->json([
                'message' => 'Invalid or expired two-factor token.',
            ], 401);
        }

        $user = User::findOrFail($cached['user_id']);

        if (! $user->validateTwoFactorCode($request->code)) {
            return response()->json([
                'message' => 'Invalid two-factor code.',
            ], 422);
        }

        $password = decrypt($cached['password']);
        $tokens = $this->issueTokens($user->email, $password);
        $this->createAuthSession($user, $request);

        return response()->json($tokens);
    }

    /**
     * Enable 2FA — returns QR URI, secret, and recovery codes.
     */
    public function enable(Request $request)
    {
        $user = $request->user();
        $twoFactor = $user->createTwoFactorAuth();

        return response()->json([
            'qr_uri' => $twoFactor->toUri(),
            'secret' => $twoFactor->toString(),
            'recovery_codes' => $user->getRecoveryCodes(),
        ]);
    }

    /**
     * Confirm 2FA with a TOTP code — activates 2FA.
     */
    public function confirm(Request $request)
    {
        $request->validate(['code' => ['required', 'string']]);

        $user = $request->user();

        if (! $user->confirmTwoFactorAuth($request->code)) {
            return response()->json([
                'message' => 'Invalid two-factor code.',
            ], 422);
        }

        return response()->json([
            'message' => 'Two-factor authentication enabled.',
        ]);
    }

    /**
     * Disable 2FA — requires password confirmation.
     */
    public function disable(Request $request)
    {
        $request->validate(['password' => ['required', 'string']]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid password.',
            ], 422);
        }

        $user->disableTwoFactorAuth();

        return response()->json([
            'message' => 'Two-factor authentication disabled.',
        ]);
    }

    /**
     * Get current recovery codes.
     */
    public function recoveryCodes(Request $request)
    {
        return response()->json([
            'recovery_codes' => $request->user()->getRecoveryCodes(),
        ]);
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerate(Request $request)
    {
        $user = $request->user();
        $user->generateRecoveryCodes();

        return response()->json([
            'recovery_codes' => $user->getRecoveryCodes(),
        ]);
    }
}
