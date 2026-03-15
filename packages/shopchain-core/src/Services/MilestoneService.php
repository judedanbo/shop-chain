<?php

namespace ShopChain\Core\Services;

use Illuminate\Support\Collection;
use ShopChain\Core\Models\Milestone;

class MilestoneService
{
    public function list(): Collection
    {
        return Milestone::orderByDesc('date')->get();
    }

    public function create(array $data): Milestone
    {
        return Milestone::create($data);
    }

    public function update(Milestone $milestone, array $data): Milestone
    {
        $milestone->update($data);

        return $milestone->refresh();
    }

    public function delete(Milestone $milestone): void
    {
        $milestone->delete();
    }
}
