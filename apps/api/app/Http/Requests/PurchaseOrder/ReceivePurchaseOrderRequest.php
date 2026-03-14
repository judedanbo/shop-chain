<?php

namespace App\Http\Requests\PurchaseOrder;

use Illuminate\Foundation\Http\FormRequest;

class ReceivePurchaseOrderRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.po_item_id' => ['required', 'uuid'],
            'items.*.quantity_received' => ['required', 'integer', 'min:1'],
            'items.*.batch_number' => ['nullable', 'string'],
        ];
    }
}
