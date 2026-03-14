<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\SupplierStatus;

class UpdateSupplierRequest extends FormRequest
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
        $supplier = $this->route('supplier');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('suppliers')->where('shop_id', $shop->id)->ignore($supplier->id),
            ],
            'contact_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'status' => ['sometimes', Rule::enum(SupplierStatus::class)],
        ];
    }
}
