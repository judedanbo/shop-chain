<?php

namespace App\Http\Requests\GoodsReceipt;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGoodsReceiptRequest extends FormRequest
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
            'notes' => ['sometimes', 'string', 'max:2000'],
            'action' => ['sometimes', 'in:complete'],
        ];
    }
}
