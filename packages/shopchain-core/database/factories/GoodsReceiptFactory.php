<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\GoodsReceiptStatus;
use ShopChain\Core\Models\GoodsReceipt;

/**
 * @extends Factory<GoodsReceipt>
 */
class GoodsReceiptFactory extends Factory
{
    protected $model = GoodsReceipt::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'reference' => 'GR-'.now()->format('Ymd').'-'.fake()->unique()->numerify('####'),
            'warehouse_id' => null,
            'receipt_date' => now(),
            'status' => GoodsReceiptStatus::Draft,
            'created_by' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GoodsReceiptStatus::Completed,
        ]);
    }
}
