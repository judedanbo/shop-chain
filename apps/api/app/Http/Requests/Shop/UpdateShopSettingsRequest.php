<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShopSettingsRequest extends FormRequest
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
            'currency' => ['sometimes', 'string', 'size:3'],
            'timezone' => ['sometimes', 'string', 'timezone'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'tax_label' => ['sometimes', 'nullable', 'string', 'max:50'],
            'receipt_footer' => ['sometimes', 'nullable', 'string', 'max:500'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
