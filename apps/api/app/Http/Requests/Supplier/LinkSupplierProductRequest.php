<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LinkSupplierProductRequest extends FormRequest
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
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'lead_time_days' => ['nullable', 'integer', 'min:0'],
            'is_preferred' => ['sometimes', 'boolean'],
        ];
    }
}
