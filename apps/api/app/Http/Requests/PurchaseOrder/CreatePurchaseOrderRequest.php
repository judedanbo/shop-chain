<?php

namespace App\Http\Requests\PurchaseOrder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\PaymentTerms;

class CreatePurchaseOrderRequest extends FormRequest
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
            'supplier_id' => [
                'required',
                'uuid',
                Rule::exists('suppliers', 'id')->where('shop_id', $shop->id),
            ],
            'warehouse_id' => [
                'nullable',
                'uuid',
                Rule::exists('warehouses', 'id')->where('shop_id', $shop->id),
            ],
            'payment_terms' => ['nullable', Rule::enum(PaymentTerms::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'expected_date' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.quantity_ordered' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.unit_id' => [
                'nullable',
                'uuid',
                Rule::exists('units_of_measure', 'id'),
            ],
            'items.*.expiry_date' => ['nullable', 'date'],
        ];
    }
}
