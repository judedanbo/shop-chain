<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\RiskLevel;

class UpdateInvestigationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'priority' => ['sometimes', 'string', Rule::enum(RiskLevel::class)],
            'assignee_id' => ['sometimes', 'uuid', 'exists:users,id'],
            'description' => ['sometimes', 'string'],
            'impact' => ['nullable', 'string'],
            'findings' => ['nullable', 'string'],
            'resolution' => ['nullable', 'string'],
        ];
    }
}
