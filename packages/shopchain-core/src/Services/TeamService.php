<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Pennant\Feature;
use ShopChain\Core\Enums\MemberStatus;
use ShopChain\Core\Enums\ShopRole;
use ShopChain\Core\Models\Branch;
use ShopChain\Core\Models\BranchMember;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Models\ShopMember;
use Spatie\Permission\PermissionRegistrar;

class TeamService
{
    /**
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function inviteMember(Shop $shop, User $inviter, array $data): ShopMember
    {
        $newRole = ShopRole::from($data['role']);

        $this->validateRoleHierarchy($inviter, $shop, $newRole);
        $this->validateGeneralManagerFeature($shop, $newRole);

        $existingMember = ShopMember::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->whereHas('user', fn ($q) => $q->where('email', $data['email']))
            ->first();

        if ($existingMember) {
            throw ValidationException::withMessages([
                'email' => ['This user is already a member of this shop.'],
            ]);
        }

        return DB::transaction(function () use ($shop, $data, $newRole) {
            $user = User::where('email', $data['email'])->first();

            if (! $user) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => str()->random(32),
                ]);
            }

            $member = ShopMember::withoutGlobalScopes()->create([
                'user_id' => $user->id,
                'shop_id' => $shop->id,
                'role' => $newRole,
                'status' => MemberStatus::Invited,
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
            $user->assignRole($newRole->value);

            if (! empty($data['branch_ids'])) {
                $this->syncBranches($member, $data['branch_ids']);
            }

            return $member->load('user', 'branches');
        });
    }

    /**
     * @throws ValidationException
     */
    public function changeRole(ShopMember $member, ShopRole $newRole, User $actor): ShopMember
    {
        if ($member->role === ShopRole::Owner) {
            throw ValidationException::withMessages([
                'role' => ['Cannot change the owner\'s role.'],
            ]);
        }

        $shop = Shop::withoutGlobalScopes()->find($member->shop_id);

        $this->validateRoleHierarchy($actor, $shop, $newRole);
        $this->validateGeneralManagerFeature($shop, $newRole);

        return DB::transaction(function () use ($member, $newRole, $shop) {
            $user = $member->user;

            app(PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
            $user->removeRole($member->role->value);
            $user->assignRole($newRole->value);

            $member->update(['role' => $newRole]);

            return $member->fresh()->load('user', 'branches');
        });
    }

    /**
     * @throws ValidationException
     */
    public function updateStatus(ShopMember $member, MemberStatus $newStatus, User $actor): ShopMember
    {
        if ($member->role === ShopRole::Owner) {
            throw ValidationException::withMessages([
                'status' => ['Cannot change the owner\'s status.'],
            ]);
        }

        if ($member->user_id === $actor->id) {
            throw ValidationException::withMessages([
                'status' => ['Cannot change your own status.'],
            ]);
        }

        $member->update(['status' => $newStatus]);

        return $member->fresh()->load('user', 'branches');
    }

    /**
     * @param  array<string>  $branchIds
     *
     * @throws ValidationException
     */
    public function assignBranches(ShopMember $member, array $branchIds): ShopMember
    {
        $this->syncBranches($member, $branchIds);

        return $member->fresh()->load('user', 'branches');
    }

    /**
     * @throws ValidationException
     */
    public function removeMember(ShopMember $member, User $actor): void
    {
        if ($member->role === ShopRole::Owner) {
            throw ValidationException::withMessages([
                'member' => ['Cannot remove the shop owner.'],
            ]);
        }

        if ($member->user_id === $actor->id) {
            throw ValidationException::withMessages([
                'member' => ['Cannot remove yourself.'],
            ]);
        }

        $shop = Shop::withoutGlobalScopes()->find($member->shop_id);

        DB::transaction(function () use ($member, $shop) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($shop->id);
            $member->user->removeRole($member->role->value);

            $member->update(['status' => MemberStatus::Removed]);
        });
    }

    /**
     * @throws ValidationException
     */
    private function validateRoleHierarchy(User $actor, Shop $shop, ShopRole $targetRole): void
    {
        $actorMember = ShopMember::withoutGlobalScopes()
            ->where('shop_id', $shop->id)
            ->where('user_id', $actor->id)
            ->first();

        if (! $actorMember || $this->hierarchyLevel($actorMember->role) <= $this->hierarchyLevel($targetRole)) {
            throw ValidationException::withMessages([
                'role' => ['You cannot assign a role at or above your own level.'],
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function validateGeneralManagerFeature(Shop $shop, ShopRole $role): void
    {
        if ($role === ShopRole::GeneralManager && ! Feature::for($shop)->active('general-manager')) {
            throw ValidationException::withMessages([
                'role' => ['The General Manager role is not available on your current plan.'],
            ]);
        }
    }

    private function hierarchyLevel(ShopRole $role): int
    {
        return match ($role) {
            ShopRole::Owner => 3,
            ShopRole::GeneralManager => 2,
            ShopRole::Manager => 1,
            default => 0,
        };
    }

    /**
     * @param  array<string>  $branchIds
     *
     * @throws ValidationException
     */
    private function syncBranches(ShopMember $member, array $branchIds): void
    {
        $shopId = $member->shop_id;

        $validCount = Branch::withoutGlobalScopes()
            ->where('shop_id', $shopId)
            ->whereIn('id', $branchIds)
            ->count();

        if ($validCount !== count($branchIds)) {
            throw ValidationException::withMessages([
                'branch_ids' => ['One or more branches do not belong to this shop.'],
            ]);
        }

        $member->branchMembers()->delete();

        foreach ($branchIds as $branchId) {
            BranchMember::create([
                'member_id' => $member->id,
                'branch_id' => $branchId,
                'assigned_at' => now(),
            ]);
        }
    }
}
