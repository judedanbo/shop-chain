<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProductRequest extends FormRequest
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
            'sku' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products')->where('shop_id', $shop->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['required', 'numeric', 'min:0'],
            'category_id' => [
                'nullable',
                'uuid',
                Rule::exists('categories', 'id')->where('shop_id', $shop->id),
            ],
            'unit_id' => [
                'nullable',
                'uuid',
                Rule::exists('units_of_measure', 'id')->where('shop_id', $shop->id),
            ],
            'barcode' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'reorder_level' => ['sometimes', 'integer', 'min:0'],
            'expiry_date' => ['nullable', 'date'],
            'batch_tracking' => ['sometimes', 'boolean'],
            'skip_kitchen' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp'],
        ];
    }
}
