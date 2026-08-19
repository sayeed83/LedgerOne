// Business layer — revises an existing Inventory Adjustment's own editable
// fields (00_BUSINESS_RULES.md Ch.44): `adjustmentType`, `quantity`,
// `reason`, `remarks` — exactly the fields `UpdateInventoryAdjustmentProps`
// (the Repository layer's own update surface) already supports; no new
// field is introduced here.
//
// Deliberately NOT done here, per this milestone's own explicit instruction:
// no approval-threshold workflow (ADJ-003/Ch.13) is evaluated, and no Stock
// quantity is read or modified — the future Stock Movement module owns
// applying an Adjustment against Stock's own on-hand quantity, not this
// service.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { InventoryAdjustment } from "../domain/entities/inventory-adjustment.entity";
import { AdjustmentType } from "../domain/enums/adjustment-type.enum";
import { InventoryAdjustmentNotFoundError } from "../domain/errors/inventory.errors";

export interface UpdateInventoryAdjustmentInput {
  tenantId: bigint;
  inventoryAdjustmentUuid: string;
  adjustmentType?: AdjustmentType;
  quantity?: string;
  reason?: string;
  remarks?: string | null;
  updatedBy?: bigint | null;
}

export interface UpdateInventoryAdjustmentDeps {
  repository: IInventoryRepository;
}

export async function updateInventoryAdjustment(
  input: UpdateInventoryAdjustmentInput,
  deps: UpdateInventoryAdjustmentDeps,
): Promise<InventoryAdjustment> {
  const { repository } = deps;

  const inventoryAdjustment = await repository.findInventoryAdjustmentByUuid(
    input.tenantId,
    input.inventoryAdjustmentUuid,
  );
  if (!inventoryAdjustment) {
    throw new InventoryAdjustmentNotFoundError(input.inventoryAdjustmentUuid);
  }

  return repository.updateInventoryAdjustment(input.tenantId, inventoryAdjustment.uuid, {
    adjustmentType: input.adjustmentType,
    quantity: input.quantity,
    reason: input.reason,
    remarks: input.remarks,
    updatedBy: input.updatedBy ?? null,
  });
}
