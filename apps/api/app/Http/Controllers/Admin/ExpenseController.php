<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExpenseRequest;
use App\Http\Requests\Admin\UpdateExpenseRequest;
use Illuminate\Http\JsonResponse;
use ShopChain\Core\Models\AdminExpense;
use ShopChain\Core\Resources\AdminExpenseResource;
use ShopChain\Core\Services\AdminExpenseService;

class ExpenseController extends Controller
{
    public function __construct(private AdminExpenseService $expenseService) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.expenses.manage'), 403);

        $expenses = $this->expenseService->list(
            request()->only('category', 'recurring', 'from', 'to', 'per_page')
        );

        return AdminExpenseResource::collection($expenses)->response();
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.expenses.manage'), 403);

        $expense = $this->expenseService->create($request->user(), $request->validated());

        return (new AdminExpenseResource($expense->load('creator', 'attachments')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(AdminExpense $expense): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.expenses.manage'), 403);

        return (new AdminExpenseResource($expense->load('creator', 'attachments')))->response();
    }

    public function update(UpdateExpenseRequest $request, AdminExpense $expense): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('admin.expenses.manage'), 403);

        $expense = $this->expenseService->update($expense, $request->validated());

        return (new AdminExpenseResource($expense->load('creator', 'attachments')))->response();
    }

    public function destroy(AdminExpense $expense): JsonResponse
    {
        abort_unless(request()->user()->hasAdminPermission('admin.expenses.manage'), 403);

        $this->expenseService->delete($expense);

        return response()->json(null, 204);
    }
}
