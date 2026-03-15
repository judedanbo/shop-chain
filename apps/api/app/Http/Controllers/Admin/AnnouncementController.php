<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateAnnouncementRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Models\Announcement;
use ShopChain\Core\Resources\AnnouncementResource;
use ShopChain\Core\Services\AnnouncementService;

class AnnouncementController extends Controller
{
    public function __construct(private AnnouncementService $announcementService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.announcements.manage'), 403);

        $announcements = $this->announcementService->list(
            request()->only('status', 'target', 'priority', 'per_page')
        );

        return AnnouncementResource::collection($announcements)->response();
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.announcements.manage'), 403);

        $announcement = $this->announcementService->create($request->user(), $request->validated());

        return (new AnnouncementResource($announcement->load('creator')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.announcements.manage'), 403);

        return (new AnnouncementResource($announcement->load('creator')))->response();
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.announcements.manage'), 403);

        $announcement = $this->announcementService->update($announcement, $request->validated());

        return (new AnnouncementResource($announcement->load('creator')))->response();
    }

    public function publish(Announcement $announcement): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.announcements.manage'), 403);

        $announcement = $this->announcementService->publish($announcement);

        return (new AnnouncementResource($announcement->load('creator')))->response();
    }

    public function unpublish(Announcement $announcement): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.announcements.manage'), 403);

        $announcement = $this->announcementService->unpublish($announcement);

        return (new AnnouncementResource($announcement->load('creator')))->response();
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.announcements.manage'), 403);

        $this->announcementService->delete($announcement);

        return response()->json(null, 204);
    }
}
