<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\CustomerType;

class CreateCustomerRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'phone' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers')->where('shop_id', $shop->id),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'type' => ['sometimes', Rule::enum(CustomerType::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
