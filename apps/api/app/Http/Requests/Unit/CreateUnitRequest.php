<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\UnitType;

class CreateUnitRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'abbreviation' => [
                'required',
                'string',
                'max:10',
                Rule::unique('units_of_measure')->where('shop_id', $shop->id),
            ],
            'type' => ['required', Rule::enum(UnitType::class)],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
