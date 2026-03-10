import type { Product, PurchaseOrder } from '@/types';

export function isProduct(obj: unknown): obj is Product {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj && 'price' in obj && 'stock' in obj;
}

export function isPurchaseOrder(obj: unknown): obj is PurchaseOrder {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'status' in obj && 'items' in obj;
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}
