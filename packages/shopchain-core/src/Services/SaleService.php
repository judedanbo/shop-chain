<?php

namespace ShopChain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ShopChain\Core\Enums\BatchStatus;
use ShopChain\Core\Enums\DiscountType;
use ShopChain\Core\Enums\PayMethod;
use ShopChain\Core\Enums\SaleSource;
use ShopChain\Core\Enums\SaleStatus;
use ShopChain\Core\Models\Batch;
use ShopChain\Core\Models\Product;
use ShopChain\Core\Models\ProductLocation;
use ShopChain\Core\Models\Sale;
use ShopChain\Core\Models\Shop;

class SaleService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function createSale(Shop $shop, array $data, User $user): Sale
    {
        return DB::transaction(function () use ($shop, $data, $user) {
            // 1. Build items: validate stock at branch
            $cartItems = [];
            $subtotal = 0;

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                $location = ProductLocation::where('product_id', $product->id)
                    ->where('branch_id', $data['branch_id'])
                    ->first();

                $available = $location ? $location->quantity : 0;

                if ($available < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Insufficient stock for {$product->name}. Available: {$available}, requested: {$item['quantity']}."],
                    ]);
                }

                $lineTotal = $item['quantity'] * $product->price;
                $subtotal += $lineTotal;

                $cartItems[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'line_total' => $lineTotal,
                    'location' => $location,
                ];
            }

            // 2-3. Compute discount
            $discount = 0;
            $discountInput = $data['discount_input'] ?? null;
            $discountType = isset($data['discount_type']) ? DiscountType::from($data['discount_type']) : null;

            if ($discountInput && $discountType) {
                if ($discountType === DiscountType::Percent) {
                    $discount = round($subtotal * ($discountInput / 100), 2);
                } else {
                    $discount = round(min($discountInput, $subtotal), 2);
                }
            }

            // 4. Compute tax
            $taxRate = (float) ($shop->tax_rate ?? 0);
            $tax = round($subtotal * ($taxRate / 100), 2);

            // 5. Compute total
            $total = round($subtotal + $tax - $discount, 2);

            // 6. Generate verify_token
            $verifyToken = Str::random(12);

            // 7. Validate payment(s)
            $paymentMethod = PayMethod::from($data['payment_method']);
            $payments = [];

            if ($paymentMethod === PayMethod::Split) {
                // Check plan feature
                $posFeature = $shop->activePlan->features['pos'] ?? 'basic';
                if ($posFeature !== 'full_split') {
                    throw ValidationException::withMessages([
                        'payment_method' => ['Split payments are not available on your current plan.'],
                    ]);
                }

                $splits = $data['splits'];
                $splitSum = array_sum(array_column($splits, 'amount'));

                if (abs($splitSum - $total) > 0.01) {
                    throw ValidationException::withMessages([
                        'splits' => ['Split payment amounts must equal the sale total.'],
                    ]);
                }

                foreach ($splits as $split) {
                    $splitMethod = PayMethod::from($split['method']);
                    $payment = [
                        'method' => $splitMethod,
                        'amount' => $split['amount'],
                        'amount_tendered' => $split['amount_tendered'] ?? $split['amount'],
                        'change_given' => 0,
                    ];

                    if ($splitMethod === PayMethod::Cash) {
                        $tendered = $split['amount_tendered'] ?? $split['amount'];
                        $payment['amount_tendered'] = $tendered;
                        $payment['change_given'] = round(max(0, $tendered - $split['amount']), 2);
                    }

                    if ($splitMethod === PayMethod::Card) {
                        $payment['card_type'] = $split['card_type'] ?? null;
                    }

                    if ($splitMethod === PayMethod::Momo) {
                        $payment['momo_provider'] = $split['momo_provider'] ?? null;
                        $payment['momo_phone'] = $split['momo_phone'] ?? null;
                        $payment['momo_ref'] = $split['momo_ref'] ?? null;
                    }

                    $payments[] = $payment;
                }
            } elseif ($paymentMethod === PayMethod::Cash) {
                $amountTendered = $data['amount_tendered'] ?? $total;

                if ($amountTendered < $total) {
                    throw ValidationException::withMessages([
                        'amount_tendered' => ['Amount tendered must be at least the sale total.'],
                    ]);
                }

                $payments[] = [
                    'method' => PayMethod::Cash,
                    'amount' => $total,
                    'amount_tendered' => $amountTendered,
                    'change_given' => round($amountTendered - $total, 2),
                ];
            } elseif ($paymentMethod === PayMethod::Card) {
                $payments[] = [
                    'method' => PayMethod::Card,
                    'amount' => $total,
                    'amount_tendered' => $total,
                    'change_given' => 0,
                    'card_type' => $data['card_type'] ?? null,
                ];
            } elseif ($paymentMethod === PayMethod::Momo) {
                $payments[] = [
                    'method' => PayMethod::Momo,
                    'amount' => $total,
                    'amount_tendered' => $total,
                    'change_given' => 0,
                    'momo_provider' => $data['momo_provider'] ?? null,
                    'momo_phone' => $data['momo_phone'] ?? null,
                    'momo_ref' => $data['momo_ref'] ?? null,
                ];
            }

            // 8. Create Sale record
            $sale = Sale::create([
                'shop_id' => $shop->id,
                'branch_id' => $data['branch_id'],
                'till_id' => $data['till_id'] ?? null,
                'cashier_id' => $user->id,
                'customer_id' => $data['customer_id'] ?? null,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'discount_input' => $discountInput,
                'discount_type' => $discountType,
                'total' => $total,
                'status' => SaleStatus::Completed,
                'source' => isset($data['source']) ? SaleSource::from($data['source']) : SaleSource::Pos,
                'verify_token' => $verifyToken,
            ]);

            // 9-11. Create SaleItems, decrement stock, handle batches
            foreach ($cartItems as $cartItem) {
                $batchId = null;

                // 11. Handle batch-tracked products (FEFO)
                if ($cartItem['product']->batch_tracking) {
                    $remaining = $cartItem['quantity'];
                    $firstBatchId = null;

                    $batches = Batch::where('product_id', $cartItem['product']->id)
                        ->where('shop_id', $shop->id)
                        ->where('status', BatchStatus::Active)
                        ->where('quantity', '>', 0)
                        ->orderByRaw('expiry_date ASC NULLS LAST')
                        ->get();

                    foreach ($batches as $batch) {
                        if ($remaining <= 0) {
                            break;
                        }

                        if (! $firstBatchId) {
                            $firstBatchId = $batch->id;
                        }

                        $consume = min($remaining, $batch->quantity);
                        $batch->decrement('quantity', $consume);
                        $remaining -= $consume;

                        if ($batch->quantity === 0) {
                            $batch->update(['status' => BatchStatus::Depleted]);
                        }
                    }

                    $batchId = $firstBatchId;
                }

                $sale->items()->create([
                    'product_id' => $cartItem['product']->id,
                    'quantity' => $cartItem['quantity'],
                    'unit_price' => $cartItem['unit_price'],
                    'discount' => 0,
                    'line_total' => $cartItem['line_total'],
                    'batch_id' => $batchId,
                ]);

                // 10. Decrement ProductLocation stock
                $cartItem['location']->decrement('quantity', $cartItem['quantity']);
            }

            // 12. Create SalePayment record(s)
            foreach ($payments as $payment) {
                $sale->payments()->create($payment);
            }

            // 13. Update Customer stats
            if ($sale->customer_id) {
                $customer = $sale->customer;
                $loyaltyPoints = (int) floor($total / 10);

                $customer->increment('visits');
                $customer->increment('total_spent', $total);
                $customer->increment('loyalty_pts', $loyaltyPoints);
                $customer->update(['last_visit' => now()]);
            }

            // 14. Return sale with relations
            return $sale->load(['items.product', 'payments', 'customer']);
        });
    }
}
