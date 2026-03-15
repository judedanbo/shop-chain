<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInvestigationRequest;
use App\Http\Requests\Admin\TransitionInvestigationRequest;
use App\Http\Requests\Admin\UpdateInvestigationRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Enums\InvestigationStatus;
use ShopChain\Core\Models\AuditEvent;
use ShopChain\Core\Models\Investigation;
use ShopChain\Core\Resources\InvestigationResource;
use ShopChain\Core\Services\InvestigationService;

class InvestigationController extends Controller
{
    public function __construct(private InvestigationService $investigationService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $investigations = $this->investigationService->list(
            request()->only('status', 'priority', 'assignee_id', 'per_page')
        );

        return InvestigationResource::collection($investigations)->response();
    }

    public function store(StoreInvestigationRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $investigation = $this->investigationService->create($request->validated());

        return (new InvestigationResource($investigation->load('assignee')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Investigation $investigation): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $investigation = $this->investigationService->show($investigation);

        return (new InvestigationResource($investigation))->response();
    }

    public function update(UpdateInvestigationRequest $request, Investigation $investigation): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $investigation = $this->investigationService->update($investigation, $request->validated());

        return (new InvestigationResource($investigation->load('assignee')))->response();
    }

    public function transition(TransitionInvestigationRequest $request, Investigation $investigation): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $status = InvestigationStatus::from($request->validated('status'));
        $investigation = $this->investigationService->transitionStatus($investigation, $status);

        return (new InvestigationResource($investigation))->response();
    }

    public function addNote(Investigation $investigation): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        request()->validate(['content' => ['required', 'string']]);

        $note = $this->investigationService->addNote(
            $investigation,
            request()->user(),
            request()->input('content')
        );

        return response()->json([
            'data' => [
                'id' => $note->id,
                'content' => $note->content,
                'author' => ['id' => $note->author->id, 'name' => $note->author->name],
                'created_at' => $note->created_at,
            ],
        ], 201);
    }

    public function linkEvent(Investigation $investigation): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        request()->validate(['audit_event_id' => ['required', 'uuid', 'exists:audit_events,id']]);

        $event = AuditEvent::findOrFail(request()->input('audit_event_id'));
        $this->investigationService->linkAuditEvent($investigation, $event);

        return response()->json(null, 204);
    }

    public function unlinkEvent(Investigation $investigation, AuditEvent $auditEvent): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.audit.investigate'), 403);

        $this->investigationService->unlinkAuditEvent($investigation, $auditEvent);

        return response()->json(null, 204);
    }
}
