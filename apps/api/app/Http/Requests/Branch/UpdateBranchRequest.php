<?php

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\BranchStatus;
use ShopChain\Core\Enums\BranchType;

class UpdateBranchRequest extends FormRequest
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
        $branch = $this->route('branch');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('branches')->where('shop_id', $shop->id)->ignore($branch->id),
            ],
            'type' => ['sometimes', Rule::enum(BranchType::class)],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'status' => ['sometimes', Rule::enum(BranchStatus::class)],
        ];
    }
}
