// Business layer — lists every Stock record belonging to a single
// Warehouse (00_BUSINESS_RULES.md Ch.38.1), scoped to a Tenant. Plain
// delegation, no filtering/sorting/aggregation, mirroring
// list-products-by-company.service.ts's own shape.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Stock } from "../domain/entities/stock.entity";

export interface ListStocksByWarehouseInput {
  tenantId: bigint;
  warehouseUuid: string;
}

export interface ListStocksByWarehouseDeps {
  repository: IInventoryRepository;
}

export async function listStocksByWarehouse(
  input: ListStocksByWarehouseInput,
  deps: ListStocksByWarehouseDeps,
): Promise<Stock[]> {
  return deps.repository.listStocksByWarehouse(input.tenantId, input.warehouseUuid);
}
