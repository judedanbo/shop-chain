<?php

namespace App\Http\Requests\Till;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\TillPayMethod;

class RecordTillPaymentRequest extends FormRequest
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
            'order_id' => [
                'required',
                'uuid',
                Rule::exists('kitchen_orders', 'id'),
            ],
            'method' => ['required', Rule::enum(TillPayMethod::class)],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'amount_tendered' => ['nullable', 'numeric', 'min:0', 'required_if:method,cash'],
            'card_type' => ['nullable', 'string', 'max:50'],
            'card_trans_no' => ['nullable', 'string', 'max:255'],
            'momo_provider' => ['nullable', 'string', 'max:100'],
            'momo_phone' => ['nullable', 'string', 'max:20'],
            'momo_trans_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
