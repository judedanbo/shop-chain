import type { SaleRecord } from '@/types';

// Module-level store for runtime sales (created via POS during this session).
// Allows the verification page to look up sales created after initial load.
const runtimeSales: SaleRecord[] = [];

export function addVerifiableSale(sale: SaleRecord): void {
  runtimeSales.push(sale);
}

export function getAllVerifiableSales(): SaleRecord[] {
  return runtimeSales;
}
