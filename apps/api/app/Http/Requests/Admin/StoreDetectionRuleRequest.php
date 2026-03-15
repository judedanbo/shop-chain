<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\RiskLevel;

class StoreDetectionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'threshold' => ['required', 'integer', 'min:1'],
            'severity' => ['required', 'string', Rule::enum(RiskLevel::class)],
            'enabled' => ['sometimes', 'boolean'],
        ];
    }
}
