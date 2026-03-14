<?php

namespace App\Http\Requests\Transfer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTransferRequest extends FormRequest
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
            'product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'from_warehouse_id' => [
                'nullable',
                'uuid',
                Rule::exists('warehouses', 'id')->where('shop_id', $shop->id),
            ],
            'to_warehouse_id' => [
                'nullable',
                'uuid',
                Rule::exists('warehouses', 'id')->where('shop_id', $shop->id),
            ],
            'from_branch_id' => [
                'nullable',
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
            'to_branch_id' => [
                'nullable',
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function ($validator) {
                $hasSource = $this->filled('from_warehouse_id') || $this->filled('from_branch_id');
                $hasDest = $this->filled('to_warehouse_id') || $this->filled('to_branch_id');

                if (! $hasSource) {
                    $validator->errors()->add('from_warehouse_id', 'At least one source location is required.');
                }

                if (! $hasDest) {
                    $validator->errors()->add('to_warehouse_id', 'At least one destination location is required.');
                }

                if ($hasSource && $hasDest) {
                    $sameWarehouse = $this->input('from_warehouse_id') === $this->input('to_warehouse_id');
                    $sameBranch = $this->input('from_branch_id') === $this->input('to_branch_id');

                    if ($sameWarehouse && $sameBranch) {
                        $validator->errors()->add('to_warehouse_id', 'Source and destination cannot be the same.');
                    }
                }
            },
        ];
    }
}
