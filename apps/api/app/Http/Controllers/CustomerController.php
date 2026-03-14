<?php

namespace App\Http\Controllers;

use App\Http\Requests\Customer\CreateCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Customer;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\CustomerResource;
use ShopChain\Core\Services\CustomerService;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerController extends Controller
{
    public function __construct(private CustomerService $customerService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $customers = QueryBuilder::for(Customer::class)
            ->allowedFilters([
                AllowedFilter::exact('type'),
                AllowedFilter::partial('name'),
                AllowedFilter::partial('phone'),
            ])
            ->allowedSorts(['name', 'total_spent', 'visits', 'created_at'])
            ->withCount('sales')
            ->defaultSort('name')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return CustomerResource::collection($customers)->response();
    }

    public function store(CreateCustomerRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $customer = $this->customerService->createCustomer($shop, $request->validated());

        return (new CustomerResource($customer))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, Customer $customer): JsonResponse
    {
        $this->authorize('view', $customer);

        $customer->loadCount('sales');

        return (new CustomerResource($customer))->response();
    }

    public function update(UpdateCustomerRequest $request, Shop $shop, Customer $customer): JsonResponse
    {
        $this->authorize('update', $customer);

        $customer = $this->customerService->updateCustomer($customer, $request->validated());

        return (new CustomerResource($customer))->response();
    }

    public function destroy(Request $request, Shop $shop, Customer $customer): JsonResponse
    {
        $this->authorize('delete', $customer);

        $this->customerService->deleteCustomer($customer);

        return response()->json(null, 204);
    }
}
