<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Models\Investigation;
use ShopChain\Core\Models\InvestigationNote;

/**
 * @extends Factory<InvestigationNote>
 */
class InvestigationNoteFactory extends Factory
{
    protected $model = InvestigationNote::class;

    public function definition(): array
    {
        return [
            'investigation_id' => Investigation::factory(),
            'author_id' => \App\Models\User::factory(),
            'content' => fake()->paragraph(),
        ];
    }
}
