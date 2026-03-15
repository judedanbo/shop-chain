<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\ExemptionUnit;

class GrantExemptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => ['required_without:unlimited', 'integer', 'min:1'],
            'unit' => ['required_without:unlimited', Rule::enum(ExemptionUnit::class)],
            'unlimited' => ['sometimes', 'boolean'],
            'reason' => ['required', 'string', 'max:500'],
            'starts_at' => ['sometimes', 'date'],
        ];
    }
}
