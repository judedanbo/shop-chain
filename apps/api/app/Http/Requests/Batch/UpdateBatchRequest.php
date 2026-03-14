<?php

namespace App\Http\Requests\Batch;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\BatchStatus;

class UpdateBatchRequest extends FormRequest
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
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'expiry_date' => ['sometimes', 'nullable', 'date'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(BatchStatus::class)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
