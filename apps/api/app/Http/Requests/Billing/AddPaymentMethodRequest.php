<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\PayType;

class AddPaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(PayType::class)],
            'provider' => ['required', 'string', 'max:50'],
            'last4' => ['nullable', 'string', 'max:4'],
            'display_name' => ['nullable', 'string', 'max:100'],
            'expiry' => ['nullable', 'string', 'max:10'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
