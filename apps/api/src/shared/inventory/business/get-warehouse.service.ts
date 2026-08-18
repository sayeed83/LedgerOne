// Business layer — reads a Warehouse by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md Ch.37.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Warehouse } from "../domain/entities/warehouse.entity";
import { WarehouseNotFoundError } from "../domain/errors/inventory.errors";

export interface GetWarehouseInput {
  tenantId: bigint;
  warehouseUuid: string;
}

export interface GetWarehouseDeps {
  repository: IInventoryRepository;
}

export async function getWarehouse(input: GetWarehouseInput, deps: GetWarehouseDeps): Promise<Warehouse> {
  const warehouse = await deps.repository.findWarehouseByUuid(input.tenantId, input.warehouseUuid);
  if (!warehouse) {
    throw new WarehouseNotFoundError(input.warehouseUuid);
  }
  return warehouse;
}
