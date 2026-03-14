<?php

namespace ShopChain\Core\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Enums\ShopStatus;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;
use Spatie\Permission\PermissionRegistrar;

class ShopService
{
    /**
     * Create a shop with owner membership, role assignment, and default branch.
     *
     * @param  \App\Models\User  $user
     * @param  array<string, mixed>  $data
     */
    public function createShop($user, array $data): Shop
    {
        return DB::transaction(function () use ($user, $data) {
            $shop = Shop::create([
                ...$data,
                'owner_id' => $user->id,
                'status' => ShopStatus::Active,
            ]);

            ShopMember::withoutGlobalScopes()->create([
                'user_id' => $user->id,
                'shop_id' => $shop->id,
                'role' => ShopRole::Owner,
                'status' => MemberStatus::Active,
                'joined_at' => now(),
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
            $user->assignRole('owner');

            Branch::withoutGlobalScopes()->create([
                'shop_id' => $shop->id,
                'name' => 'Main Branch',
                'is_default' => true,
            ]);

            return $shop->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateShop(Shop $shop, array $data): Shop
    {
        $shop->update($data);

        return $shop->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateSettings(Shop $shop, array $data): Shop
    {
        $allowed = ['currency', 'timezone', 'tax_rate', 'tax_label', 'receipt_footer', 'low_stock_threshold'];

        $shop->update(array_intersect_key($data, array_flip($allowed)));

        return $shop->fresh();
    }

    public function deleteShop(Shop $shop): void
    {
        $shop->delete();
    }

    public function uploadLogo(Shop $shop, UploadedFile $file): string
    {
        // Delete old logo if exists
        if ($shop->logo_url) {
            $this->deleteLogoFile($shop->logo_url);
        }

        $path = Storage::disk('s3')->putFile("shops/{$shop->id}/logo", $file, 'public');
        $url = Storage::disk('s3')->url($path);

        $shop->update(['logo_url' => $url]);

        return $url;
    }

    public function deleteLogo(Shop $shop): void
    {
        if ($shop->logo_url) {
            $this->deleteLogoFile($shop->logo_url);
            $shop->update(['logo_url' => null]);
        }
    }

    private function deleteLogoFile(string $url): void
    {
        $path = parse_url($url, PHP_URL_PATH);

        if ($path) {
            // Remove leading slash
            $path = ltrim($path, '/');
            Storage::disk('s3')->delete($path);
        }
    }
}
