<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignBranchesRequest extends FormRequest
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
            'branch_ids' => ['required', 'array'],
            'branch_ids.*' => [
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
        ];
    }
}
