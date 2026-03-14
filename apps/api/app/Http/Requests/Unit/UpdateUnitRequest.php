<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use ShopChain\Core\Enums\UnitType;

class UpdateUnitRequest extends FormRequest
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
        $unit = $this->route('unit');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'abbreviation' => [
                'sometimes',
                'string',
                'max:10',
                Rule::unique('units_of_measure')->where('shop_id', $shop->id)->ignore($unit->id),
            ],
            'type' => ['sometimes', Rule::enum(UnitType::class)],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
