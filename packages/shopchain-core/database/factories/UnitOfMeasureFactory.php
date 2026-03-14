<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\UnitType;
use ShopChain\Core\Models\UnitOfMeasure;

/**
 * @extends Factory<UnitOfMeasure>
 */
class UnitOfMeasureFactory extends Factory
{
    protected $model = UnitOfMeasure::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'name' => fake()->word(),
            'abbreviation' => fake()->unique()->lexify('??'),
            'type' => fake()->randomElement(UnitType::cases()),
        ];
    }
}
