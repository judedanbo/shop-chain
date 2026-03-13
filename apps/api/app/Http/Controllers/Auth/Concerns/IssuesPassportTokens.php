<?php

namespace App\Http\Controllers\Auth\Concerns;

use App\Models\User;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Session;

trait IssuesPassportTokens
{
    /**
     * Issue access + refresh tokens via Passport's password grant.
     * Uses internal request dispatch to avoid self-referential HTTP deadlock.
     *
     * @return array{token_type: string, access_token: string, refresh_token: string, expires_in: int}
     */
    protected function issueTokens(string $email, string $password): array
    {
        $config = config('passport.password_client');

        $tokenRequest = Request::create('/oauth/token', 'POST', [
            'grant_type' => 'password',
            'client_id' => $config['id'],
            'client_secret' => $config['secret'],
            'username' => $email,
            'password' => $password,
            'scope' => '',
        ]);

        $response = app()->handle($tokenRequest);

        return json_decode($response->getContent(), true);
    }

    /**
     * Refresh tokens via Passport's refresh_token grant.
     * Uses internal request dispatch to avoid self-referential HTTP deadlock.
     *
     * @return array{token_type: string, access_token: string, refresh_token: string, expires_in: int}
     */
    protected function refreshTokens(string $refreshToken): array
    {
        $config = config('passport.password_client');

        $tokenRequest = Request::create('/oauth/token', 'POST', [
            'grant_type' => 'refresh_token',
            'client_id' => $config['id'],
            'client_secret' => $config['secret'],
            'refresh_token' => $refreshToken,
            'scope' => '',
        ]);

        $response = app()->handle($tokenRequest);

        return json_decode($response->getContent(), true);
    }

    /**
     * Create a session record and mark others as non-current.
     */
    protected function createAuthSession(User $user, Request $request): Session
    {
        $user->sessions()->update(['is_current' => false]);

        return $user->sessions()->create([
            'device' => $request->userAgent(),
            'ip_address' => $request->ip(),
            'is_current' => true,
            'last_active' => now(),
            'expires_at' => now()->addDays(30),
        ]);
    }
}
