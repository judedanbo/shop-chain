<?php

namespace App\Http\Requests\KitchenOrder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\OrderType;

class PlaceKitchenOrderRequest extends FormRequest
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
            'till_id' => [
                'required',
                'uuid',
                Rule::exists('tills', 'id')->where('shop_id', $shop->id),
            ],
            'branch_id' => [
                'required',
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
            'table_number' => ['nullable', 'string', 'max:50'],
            'order_type' => ['required', Rule::enum(OrderType::class)],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
