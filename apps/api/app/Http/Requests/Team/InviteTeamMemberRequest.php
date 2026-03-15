<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\ShopRole;

class InviteTeamMemberRequest extends FormRequest
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
        $shop = $this->route('shop');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'role' => [
                'required',
                Rule::enum(ShopRole::class),
                Rule::notIn([ShopRole::Owner->value]),
            ],
            'branch_ids' => ['nullable', 'array'],
            'branch_ids.*' => [
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
        ];
    }
}
