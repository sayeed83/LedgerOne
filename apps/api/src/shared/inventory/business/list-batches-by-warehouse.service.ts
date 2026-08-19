// Business layer — lists every Batch belonging to a single Warehouse
// (00_BUSINESS_RULES.md Ch.40), scoped to a Tenant. Plain Repository
// passthrough, mirroring list-inventory-adjustments-by-warehouse.service.ts's
// own shape — `warehouseUuid` is required, not optional, a distinct use
// case from a tenant- or company-wide list. No FEFO ordering (BAT-002) or
// expiry filtering (BAT-003) applied here.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Batch } from "../domain/entities/batch.entity";

export interface ListBatchesByWarehouseInput {
  tenantId: bigint;
  warehouseUuid: string;
}

export interface ListBatchesByWarehouseDeps {
  repository: IInventoryRepository;
}

export async function listBatchesByWarehouse(
  input: ListBatchesByWarehouseInput,
  deps: ListBatchesByWarehouseDeps,
): Promise<Batch[]> {
  return deps.repository.listBatchesByWarehouse(input.tenantId, input.warehouseUuid);
}
