<?php

namespace App\Http\Requests\Warehouse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\WarehouseStatus;
use ShopChain\Core\Enums\WarehouseType;

class UpdateWarehouseRequest extends FormRequest
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
        $warehouse = $this->route('warehouse');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('warehouses')->where('shop_id', $shop->id)->ignore($warehouse->id),
            ],
            'type' => ['sometimes', Rule::enum(WarehouseType::class)],
            'status' => ['sometimes', Rule::enum(WarehouseStatus::class)],
            'manager_id' => ['sometimes', 'nullable', 'uuid', 'exists:users,id'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'zones' => ['sometimes', 'nullable', 'array'],
            'zones.*' => ['string'],
        ];
    }
}
