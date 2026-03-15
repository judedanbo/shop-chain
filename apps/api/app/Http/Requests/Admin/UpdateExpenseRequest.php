<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\ExpenseCategory;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'date' => ['sometimes', 'date'],
            'category' => ['sometimes', 'string', Rule::enum(ExpenseCategory::class)],
            'description' => ['sometimes', 'string', 'max:500'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'vendor' => ['sometimes', 'string', 'max:255'],
            'recurring' => ['sometimes', 'boolean'],
            'reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
