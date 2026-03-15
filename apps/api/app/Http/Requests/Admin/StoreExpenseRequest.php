<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\ExpenseCategory;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'category' => ['required', 'string', Rule::enum(ExpenseCategory::class)],
            'description' => ['required', 'string', 'max:500'],
            'amount' => ['required', 'numeric', 'min:0'],
            'vendor' => ['required', 'string', 'max:255'],
            'recurring' => ['sometimes', 'boolean'],
            'reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
