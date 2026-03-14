<?php

namespace ShopChain\Core\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ShopChain\Core\Enums\ProductStatus;
use ShopChain\Core\Models\PriceHistory;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\Shop;

class ProductService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createProduct(Shop $shop, array $data, ?UploadedFile $image = null): Product
    {
        return DB::transaction(function () use ($shop, $data, $image) {
            $product = Product::create([
                ...$data,
                'shop_id' => $shop->id,
                'status' => $data['status'] ?? ProductStatus::InStock,
            ]);

            if ($image) {
                $this->uploadImage($product, $image);
            }

            return $product->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateProduct(Product $product, array $data, ?UploadedFile $image = null): Product
    {
        $product->update($data);

        if ($image) {
            $this->uploadImage($product, $image);
        }

        return $product->fresh();
    }

    public function deleteProduct(Product $product): void
    {
        if ($product->image_url) {
            $this->deleteImageFile($product->image_url);
        }

        $product->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  \App\Models\User  $user
     */
    public function updatePrice(Product $product, array $data, $user): Product
    {
        return DB::transaction(function () use ($product, $data, $user) {
            PriceHistory::create([
                'product_id' => $product->id,
                'shop_id' => $product->shop_id,
                'old_price' => $product->price,
                'new_price' => $data['price'] ?? $product->price,
                'old_cost' => $product->cost,
                'new_cost' => $data['cost'] ?? $product->cost,
                'reason' => $data['reason'] ?? null,
                'changed_by' => $user->id,
            ]);

            $product->update(array_intersect_key($data, array_flip(['price', 'cost'])));

            return $product->fresh();
        });
    }

    public function uploadImage(Product $product, UploadedFile $file): string
    {
        if ($product->image_url) {
            $this->deleteImageFile($product->image_url);
        }

        $path = Storage::disk('s3')->putFile("products/{$product->id}/image", $file, 'public');
        $url = Storage::disk('s3')->url($path);

        $product->update(['image_url' => $url]);

        return $url;
    }

    public function deleteImage(Product $product): void
    {
        if ($product->image_url) {
            $this->deleteImageFile($product->image_url);
            $product->update(['image_url' => null]);
        }
    }

    private function deleteImageFile(string $url): void
    {
        $path = parse_url($url, PHP_URL_PATH);

        if ($path) {
            $path = ltrim($path, '/');
            Storage::disk('s3')->delete($path);
        }
    }
}
