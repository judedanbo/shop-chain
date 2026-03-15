<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Models\AuditEvent;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\AuditEventResource;
use ShopChain\Core\Services\AuditService;

class AuditController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function events(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.view'), 403);

        $events = $this->auditService->listEvents(
            request()->only('category', 'risk_min', 'risk_max', 'from', 'to', 'shop_id', 'actor_id', 'search', 'per_page')
        );

        return AuditEventResource::collection($events)->response();
    }

    public function showEvent(AuditEvent $auditEvent): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.view'), 403);

        $event = $this->auditService->showEvent($auditEvent);

        return (new AuditEventResource($event))->response();
    }

    public function shopForensics(Shop $shop): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.view'), 403);

        $events = $this->auditService->getEventsByShop(
            $shop,
            request()->only('category', 'risk_min', 'risk_max', 'from', 'to', 'search', 'per_page')
        );

        return AuditEventResource::collection($events)->response();
    }

    public function userForensics(User $user): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.view'), 403);

        $events = $this->auditService->getEventsByUser(
            $user,
            request()->only('category', 'risk_min', 'risk_max', 'from', 'to', 'search', 'per_page')
        );

        return AuditEventResource::collection($events)->response();
    }
}
