// Business layer — lists every Stock Movement involving a single Warehouse,
// on either side (`sourceWarehouseUuid` or `destinationWarehouseUuid`,
// 00_BUSINESS_RULES.md Ch.39.10), scoped to a Tenant. Plain Repository
// passthrough, mirroring list-inventory-adjustments-by-warehouse.service.ts's
// own shape — `warehouseUuid` is required, not optional, a distinct use
// case from a tenant- or company-wide list.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { StockMovement } from "../domain/entities/stock-movement.entity";

export interface ListStockMovementsByWarehouseInput {
  tenantId: bigint;
  warehouseUuid: string;
}

export interface ListStockMovementsByWarehouseDeps {
  repository: IInventoryRepository;
}

export async function listStockMovementsByWarehouse(
  input: ListStockMovementsByWarehouseInput,
  deps: ListStockMovementsByWarehouseDeps,
): Promise<StockMovement[]> {
  return deps.repository.listStockMovementsByWarehouse(input.tenantId, input.warehouseUuid);
}
