<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\RiskLevel;

class StoreInvestigationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'string', Rule::enum(RiskLevel::class)],
            'assignee_id' => ['required', 'uuid', 'exists:users,id'],
            'description' => ['required', 'string'],
            'impact' => ['nullable', 'string'],
        ];
    }
}
