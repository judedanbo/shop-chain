<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\PlanLifecycle;

class TransitionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lifecycle' => ['required', Rule::enum(PlanLifecycle::class)],
            'fallback_id' => ['nullable', 'string', 'exists:plans,id'],
        ];
    }
}
