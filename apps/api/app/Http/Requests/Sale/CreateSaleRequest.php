<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\DiscountType;
use ShopChain\Core\Enums\PayMethod;
use ShopChain\Core\Enums\SaleSource;

class CreateSaleRequest extends FormRequest
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
            'branch_id' => [
                'required',
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
            'till_id' => [
                'nullable',
                'uuid',
                Rule::exists('tills', 'id')->where('shop_id', $shop->id),
            ],
            'customer_id' => [
                'nullable',
                'uuid',
                Rule::exists('customers', 'id')->where('shop_id', $shop->id),
            ],
            'source' => ['sometimes', Rule::enum(SaleSource::class)],
            'discount_input' => ['nullable', 'numeric', 'min:0'],
            'discount_type' => ['nullable', 'required_with:discount_input', Rule::enum(DiscountType::class)],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', Rule::enum(PayMethod::class)],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
            'card_type' => ['nullable', 'string'],
            'momo_provider' => ['nullable', 'string'],
            'momo_phone' => ['nullable', 'string'],
            'momo_ref' => ['nullable', 'string'],
            'splits' => ['required_if:payment_method,split', 'array', 'min:2', 'max:4'],
            'splits.*.method' => ['required_with:splits', Rule::in(['cash', 'card', 'momo'])],
            'splits.*.amount' => ['required_with:splits', 'numeric', 'min:0.01'],
            'splits.*.amount_tendered' => ['nullable', 'numeric'],
            'splits.*.card_type' => ['nullable', 'string'],
            'splits.*.momo_provider' => ['nullable', 'string'],
            'splits.*.momo_phone' => ['nullable', 'string'],
            'splits.*.momo_ref' => ['nullable', 'string'],
        ];
    }
}
