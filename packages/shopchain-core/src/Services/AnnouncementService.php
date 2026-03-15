<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use ShopChain\Core\Enums\AnnouncementStatus;
use ShopChain\Core\Models\Announcement;

class AnnouncementService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = Announcement::with('creator');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['target'])) {
            $query->where('target', $filters['target']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    public function create(User $creator, array $data): Announcement
    {
        return Announcement::create([
            ...$data,
            'status' => AnnouncementStatus::Draft,
            'created_by' => $creator->id,
        ]);
    }

    public function update(Announcement $announcement, array $data): Announcement
    {
        $announcement->update($data);

        return $announcement->refresh();
    }

    public function publish(Announcement $announcement): Announcement
    {
        $announcement->update(['status' => AnnouncementStatus::Active]);

        return $announcement->refresh();
    }

    public function unpublish(Announcement $announcement): Announcement
    {
        $announcement->update(['status' => AnnouncementStatus::Draft]);

        return $announcement->refresh();
    }

    public function delete(Announcement $announcement): void
    {
        $announcement->delete();
    }
}
