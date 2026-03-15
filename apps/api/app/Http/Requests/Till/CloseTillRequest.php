<?php

namespace App\Http\Requests\Till;

use Illuminate\Foundation\Http\FormRequest;

class CloseTillRequest extends FormRequest
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
            'closing_balance' => ['required', 'numeric', 'min:0'],
        ];
    }
}
