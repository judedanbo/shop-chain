<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\RiskLevel;

class UpdateDetectionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'threshold' => ['sometimes', 'integer', 'min:1'],
            'severity' => ['sometimes', 'string', Rule::enum(RiskLevel::class)],
            'enabled' => ['sometimes', 'boolean'],
        ];
    }
}
