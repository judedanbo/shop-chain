<?php

namespace App\Http\Requests\Adjustment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\AdjustmentType;

class CreateAdjustmentRequest extends FormRequest
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
            'batch_id' => [
                'nullable',
                'uuid',
                Rule::exists('batches', 'id')->where('shop_id', $shop->id),
            ],
            'warehouse_id' => [
                'nullable',
                'uuid',
                Rule::exists('warehouses', 'id')->where('shop_id', $shop->id),
            ],
            'branch_id' => [
                'nullable',
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
            'type' => ['required', Rule::enum(AdjustmentType::class)],
            'quantity_change' => ['required', 'integer', 'not_in:0'],
            'adjustment_date' => ['sometimes', 'date'],
            'reason' => ['required', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
