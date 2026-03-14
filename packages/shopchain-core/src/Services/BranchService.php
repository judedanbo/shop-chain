<?php

namespace ShopChain\Core\Services;

use Illuminate\Validation\ValidationException;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Shop;

class BranchService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createBranch(Shop $shop, array $data): Branch
    {
        return Branch::create([
            ...$data,
            'shop_id' => $shop->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateBranch(Branch $branch, array $data): Branch
    {
        $branch->update($data);

        return $branch->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function deleteBranch(Branch $branch): void
    {
        if ($branch->is_default) {
            throw ValidationException::withMessages([
                'branch' => ['The default branch cannot be deleted.'],
            ]);
        }

        $branch->delete();
    }
}
