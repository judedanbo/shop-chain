<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\CustomerType;

class UpdateCustomerRequest extends FormRequest
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
        $customer = $this->route('customer');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers')->where('shop_id', $shop->id)->ignore($customer->id),
            ],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'type' => ['sometimes', Rule::enum(CustomerType::class)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
