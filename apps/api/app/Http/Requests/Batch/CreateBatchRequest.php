<?php

namespace App\Http\Requests\Batch;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateBatchRequest extends FormRequest
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
        $shop = $this->route('shop');

        return [
            'batch_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('batches')->where('shop_id', $shop->id),
            ],
            'quantity' => ['required', 'integer', 'min:1'],
            'expiry_date' => ['nullable', 'date'],
            'received_date' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
