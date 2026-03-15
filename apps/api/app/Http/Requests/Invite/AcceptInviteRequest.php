<?php

namespace App\Http\Requests\Invite;

use Illuminate\Foundation\Http\FormRequest;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Models\ShopMember;

class AcceptInviteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $member = ShopMember::withoutGlobalScopes()
            ->where('invite_token', $this->route('token'))
            ->where('status', MemberStatus::Invited)
            ->first();

        $requiresPassword = $member && $member->user->last_active_at === null;

        if ($requiresPassword) {
            return [
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ];
        }

        return [
            'password' => ['nullable'],
        ];
    }
}
