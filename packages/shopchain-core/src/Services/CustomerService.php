<?php

namespace ShopChain\Core\Services;

use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\CustomerType;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\Shop;

class CustomerService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createCustomer(Shop $shop, array $data): Customer
    {
        return Customer::create([
            'type' => CustomerType::Regular,
            ...$data,
            'shop_id' => $shop->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateCustomer(Customer $customer, array $data): Customer
    {
        $customer->update($data);

        return $customer->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function deleteCustomer(Customer $customer): void
    {
        if ($customer->sales()->exists()) {
            throw ValidationException::withMessages([
                'customer' => ['Cannot delete a customer with existing sales.'],
            ]);
        }

        $customer->delete();
    }
}
