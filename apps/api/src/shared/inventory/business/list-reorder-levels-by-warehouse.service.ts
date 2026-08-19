// Business layer — lists every Reorder Level belonging to a single
// Warehouse (00_BUSINESS_RULES.md Ch.42), scoped to a Tenant. Plain
// Repository passthrough, mirroring list-stocks-by-warehouse.service.ts's
// own shape — `warehouseUuid` is required, not optional, a distinct use
// case from a tenant/company-wide list.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ReorderLevel } from "../domain/entities/reorder-level.entity";

export interface ListReorderLevelsByWarehouseInput {
  tenantId: bigint;
  warehouseUuid: string;
}

export interface ListReorderLevelsByWarehouseDeps {
  repository: IInventoryRepository;
}

export async function listReorderLevelsByWarehouse(
  input: ListReorderLevelsByWarehouseInput,
  deps: ListReorderLevelsByWarehouseDeps,
): Promise<ReorderLevel[]> {
  return deps.repository.listReorderLevelsByWarehouse(input.tenantId, input.warehouseUuid);
}
