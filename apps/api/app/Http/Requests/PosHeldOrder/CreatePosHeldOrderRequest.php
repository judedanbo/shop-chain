<?php

namespace App\Http\Requests\PosHeldOrder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\DiscountType;

class CreatePosHeldOrderRequest extends FormRequest
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
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'discount_type' => ['nullable', Rule::enum(DiscountType::class)],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
