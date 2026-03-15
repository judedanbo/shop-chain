<?php

namespace App\Http\Controllers;

use App\Http\Requests\Notification\TakeActionRequest;
use App\Http\Requests\Notification\UpdatePreferencesRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Enums\NotifAction;
use ShopChain\Core\Models\Notification;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\NotificationPreferenceResource;
use ShopChain\Core\Resources\NotificationResource;
use ShopChain\Core\Services\NotificationService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);

        $notifications = QueryBuilder::for(
            Notification::where('user_id', $request->user()->id)
                ->where('shop_id', $shop->id)
        )
            ->allowedFilters([
                AllowedFilter::exact('category'),
                AllowedFilter::exact('priority'),
                AllowedFilter::exact('is_read'),
                AllowedFilter::exact('requires_action'),
            ])
            ->allowedSorts(['created_at', 'priority'])
            ->defaultSort('-created_at')
            ->with('actor')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return NotificationResource::collection($notifications)->response();
    }

    public function markAsRead(Request $request, Shop $shop, Notification $notification): JsonResponse
    {
        $this->authorize('update', $notification);

        $notification = $this->notificationService->markAsRead($notification);

        return (new NotificationResource($notification))->response();
    }

    public function markAllRead(Request $request, Shop $shop): JsonResponse
    {
        $count = $this->notificationService->markAllRead($request->user(), $shop->id);

        return response()->json(['marked_read' => $count]);
    }

    public function destroy(Request $request, Shop $shop, Notification $notification): JsonResponse
    {
        $this->authorize('delete', $notification);

        $this->notificationService->delete($notification);

        return response()->json(null, 204);
    }

    public function action(TakeActionRequest $request, Shop $shop, Notification $notification): JsonResponse
    {
        $this->authorize('takeAction', $notification);

        $action = NotifAction::from($request->validated('action'));
        $notification = $this->notificationService->takeAction($notification, $action, $request->user());

        return (new NotificationResource($notification))->response();
    }

    public function preferences(Request $request, Shop $shop): JsonResponse
    {
        $preferences = $this->notificationService->getPreferences($request->user());

        return (new NotificationPreferenceResource($preferences))->response();
    }

    public function updatePreferences(UpdatePreferencesRequest $request, Shop $shop): JsonResponse
    {
        $preferences = $this->notificationService->updatePreferences(
            $request->user(),
            $request->validated(),
        );

        return (new NotificationPreferenceResource($preferences))->response();
    }
}
