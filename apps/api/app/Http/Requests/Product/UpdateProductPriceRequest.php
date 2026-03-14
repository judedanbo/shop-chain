<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductPriceRequest extends FormRequest
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
        return [
            'price' => ['sometimes', 'numeric', 'min:0'],
            'cost' => ['sometimes', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'price.required_without' => 'At least one of price or cost is required.',
            'cost.required_without' => 'At least one of price or cost is required.',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                if (! $this->has('price') && ! $this->has('cost')) {
                    $validator->errors()->add('price', 'At least one of price or cost is required.');
                }
            },
        ];
    }
}
