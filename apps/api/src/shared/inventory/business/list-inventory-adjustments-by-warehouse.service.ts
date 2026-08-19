// Business layer — lists every Inventory Adjustment belonging to a single
// Warehouse (00_BUSINESS_RULES.md Ch.44), scoped to a Tenant. Plain
// Repository passthrough, mirroring list-warehouses-by-branch.service.ts's
// own shape — `warehouseUuid` is required, not optional, a distinct use
// case from a tenant- or company-wide list.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { InventoryAdjustment } from "../domain/entities/inventory-adjustment.entity";

export interface ListInventoryAdjustmentsByWarehouseInput {
  tenantId: bigint;
  warehouseUuid: string;
}

export interface ListInventoryAdjustmentsByWarehouseDeps {
  repository: IInventoryRepository;
}

export async function listInventoryAdjustmentsByWarehouse(
  input: ListInventoryAdjustmentsByWarehouseInput,
  deps: ListInventoryAdjustmentsByWarehouseDeps,
): Promise<InventoryAdjustment[]> {
  return deps.repository.listInventoryAdjustmentsByWarehouse(input.tenantId, input.warehouseUuid);
}
