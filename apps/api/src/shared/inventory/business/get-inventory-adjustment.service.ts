// Business layer — reads an Inventory Adjustment by its external
// identifier, scoped to the supplied Tenant (00_BUSINESS_RULES.md Ch.44).
// Never resolves by the internal `id` (06_DATABASE_STANDARDS.md PK-003) —
// callers outside this module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { InventoryAdjustment } from "../domain/entities/inventory-adjustment.entity";
import { InventoryAdjustmentNotFoundError } from "../domain/errors/inventory.errors";

export interface GetInventoryAdjustmentInput {
  tenantId: bigint;
  inventoryAdjustmentUuid: string;
}

export interface GetInventoryAdjustmentDeps {
  repository: IInventoryRepository;
}

export async function getInventoryAdjustment(
  input: GetInventoryAdjustmentInput,
  deps: GetInventoryAdjustmentDeps,
): Promise<InventoryAdjustment> {
  const inventoryAdjustment = await deps.repository.findInventoryAdjustmentByUuid(
    input.tenantId,
    input.inventoryAdjustmentUuid,
  );
  if (!inventoryAdjustment) {
    throw new InventoryAdjustmentNotFoundError(input.inventoryAdjustmentUuid);
  }
  return inventoryAdjustment;
}
