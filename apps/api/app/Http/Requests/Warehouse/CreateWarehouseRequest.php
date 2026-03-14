<?php

namespace App\Http\Requests\Warehouse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\WarehouseType;

class CreateWarehouseRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('warehouses')->where('shop_id', $shop->id),
            ],
            'type' => ['sometimes', Rule::enum(WarehouseType::class)],
            'manager_id' => ['nullable', 'uuid', 'exists:users,id'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'zones' => ['nullable', 'array'],
            'zones.*' => ['string'],
        ];
    }
}
