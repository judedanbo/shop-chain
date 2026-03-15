<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use ShopChain\Core\Enums\AdminRole;
use ShopChain\Core\Enums\AdminTeamStatus;
use ShopChain\Core\Models\AdminUser;

class AdminTeamService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = AdminUser::with('user', 'createdBy');

        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->whereHas('user', function ($q) use ($filters) {
                $q->where('name', 'ilike', "%{$filters['search']}%")
                    ->orWhere('email', 'ilike', "%{$filters['search']}%");
            });
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function invite(User $creator, array $data): AdminUser
    {
        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => bcrypt(str()->random(32)),
            ]);
        }

        if (AdminUser::where('user_id', $user->id)->exists()) {
            throw new \InvalidArgumentException('This user is already an admin team member.');
        }

        $role = AdminRole::from($data['role']);

        $adminUser = AdminUser::create([
            'user_id' => $user->id,
            'role' => $role,
            'status' => AdminTeamStatus::Invited,
            'created_by' => $creator->id,
        ]);

        return $adminUser->load('user', 'createdBy');
    }

    public function show(AdminUser $adminUser): AdminUser
    {
        return $adminUser->load('user', 'createdBy');
    }

    public function updateRole(AdminUser $adminUser, AdminRole $newRole): AdminUser
    {
        if ($newRole === AdminRole::SuperAdmin && $adminUser->role !== AdminRole::SuperAdmin) {
            $currentUser = auth()->user();
            $currentAdmin = AdminUser::where('user_id', $currentUser->id)->first();

            if (! $currentAdmin || $currentAdmin->role !== AdminRole::SuperAdmin) {
                throw new \InvalidArgumentException('Only a Super Admin can promote to Super Admin.');
            }
        }

        $adminUser->update(['role' => $newRole]);

        return $adminUser->refresh()->load('user');
    }

    public function updateStatus(AdminUser $adminUser, AdminTeamStatus $newStatus): AdminUser
    {
        $currentUser = auth()->user();

        if ($adminUser->user_id === $currentUser->id) {
            throw new \InvalidArgumentException('You cannot change your own status.');
        }

        if ($adminUser->role === AdminRole::SuperAdmin && $newStatus === AdminTeamStatus::Suspended) {
            $activeSuperAdmins = AdminUser::where('role', AdminRole::SuperAdmin)
                ->where('status', AdminTeamStatus::Active)
                ->count();

            if ($activeSuperAdmins <= 1) {
                throw new \InvalidArgumentException('Cannot suspend the last active Super Admin.');
            }
        }

        $adminUser->update(['status' => $newStatus]);

        return $adminUser->refresh()->load('user');
    }

    public function remove(AdminUser $adminUser): void
    {
        $currentUser = auth()->user();

        if ($adminUser->user_id === $currentUser->id) {
            throw new \InvalidArgumentException('You cannot remove yourself.');
        }

        if ($adminUser->role === AdminRole::SuperAdmin) {
            $superAdminCount = AdminUser::where('role', AdminRole::SuperAdmin)->count();

            if ($superAdminCount <= 1) {
                throw new \InvalidArgumentException('Cannot remove the last Super Admin.');
            }
        }

        $adminUser->delete();
    }
}
