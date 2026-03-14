<?php

namespace App\Http\Requests\GoodsReceipt;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\BatchCondition;

class CreateGoodsReceiptRequest extends FormRequest
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
            'warehouse_id' => [
                'required',
                'uuid',
                Rule::exists('warehouses', 'id')->where('shop_id', $shop->id),
            ],
            'receipt_date' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.batch_number' => ['nullable', 'string', 'max:255'],
            'items.*.condition' => ['nullable', Rule::enum(BatchCondition::class)],
            'items.*.expiry_date' => ['nullable', 'date'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
