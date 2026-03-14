<?php

namespace ShopChain\Core\Services;

use Illuminate\Validation\ValidationException;
use ShopChain\Core\Models\Category;
use ShopChain\Core\Models\Shop;

class CategoryService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createCategory(Shop $shop, array $data): Category
    {
        return Category::create([
            ...$data,
            'shop_id' => $shop->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateCategory(Category $category, array $data): Category
    {
        $category->update($data);

        return $category->fresh();
    }

    /**
     * @throws ValidationException
     */
    public function deleteCategory(Category $category): void
    {
        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => ['Cannot delete a category that has products.'],
            ]);
        }

        $category->delete();
    }
}
