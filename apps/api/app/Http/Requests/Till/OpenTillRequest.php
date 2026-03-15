<?php

namespace App\Http\Requests\Till;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OpenTillRequest extends FormRequest
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
            'branch_id' => [
                'required',
                'uuid',
                Rule::exists('branches', 'id')->where('shop_id', $shop->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'opening_float' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
