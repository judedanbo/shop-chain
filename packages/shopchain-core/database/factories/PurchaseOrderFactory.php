<?php

namespace ShopChain\Core\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use ShopChain\Core\Enums\PaymentTerms;
use ShopChain\Core\Enums\PoStatus;
use ShopChain\Core\Models\PurchaseOrder;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'supplier_id' => null,
            'warehouse_id' => null,
            'status' => PoStatus::Draft,
            'payment_terms' => PaymentTerms::Cod,
            'created_by' => null,
            'expected_date' => now()->addDays(7),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PoStatus::Pending,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PoStatus::Approved,
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PoStatus::Shipped,
        ]);
    }

    public function partial(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PoStatus::Partial,
        ]);
    }

    public function received(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PoStatus::Received,
            'received_date' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PoStatus::Cancelled,
        ]);
    }
}
