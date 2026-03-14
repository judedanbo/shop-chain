<?php

namespace App\Http\Controllers;

use App\Http\Requests\Category\CreateCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ShopChain\Core\Models\Category;
use ShopChain\Core\Models\Shop;
use ShopChain\Core\Resources\CategoryResource;
use ShopChain\Core\Services\CategoryService;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $categoryService) {}

    public function index(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        $categories = $shop->categories()
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories)->response();
    }

    public function store(CreateCategoryRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('create', Category::class);

        $category = $this->categoryService->createCategory($shop, $request->validated());

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Shop $shop, Category $category): JsonResponse
    {
        $this->authorize('view', $category);

        $category->loadCount('products');

        return (new CategoryResource($category))->response();
    }

    public function update(UpdateCategoryRequest $request, Shop $shop, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $category = $this->categoryService->updateCategory($category, $request->validated());

        return (new CategoryResource($category))->response();
    }

    public function destroy(Request $request, Shop $shop, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $this->categoryService->deleteCategory($category);

        return response()->json(null, 204);
    }
}
