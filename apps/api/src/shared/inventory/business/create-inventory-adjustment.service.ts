// Business layer — records a new Inventory Adjustment
// (00_BUSINESS_RULES.md Ch.44): a manual correction to a Product's Stock
// quantity in a Warehouse. This service creates the adjustment RECORD only.
//
// This milestone's own instruction asked for a pre-create check that
// "another Inventory Adjustment with the same UUID does not exist." That
// check is not implementable as stated: `uuid` is never a caller-supplied
// field anywhere in this Repository's `createInventoryAdjustment` (the
// Repository layer generates it internally via `randomUUID()`, mirroring
// every other Inventory entity's create path, PK-003) — there is no
// client-supplied identifier here to collide against. Flagged rather than
// silently invented; no duplicate-uuid check is performed.
//
// Deliberately NOT done here, per this milestone's own explicit instruction:
// no Stock quantity is read or modified (the future Stock Movement module
// owns applying an Adjustment against Stock's own on-hand quantity), no
// Journal Entry is created (ADJ-002), and no approval-threshold workflow
// (ADJ-003/Ch.13) is evaluated. `companyUuid`/`warehouseUuid` (cross-module/
// in-module uuid references) and `productId` (real, in-module FK) are not
// validated for existence here, mirroring every other Inventory create
// service's handling of its own cross-reference fields.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { InventoryAdjustment } from "../domain/entities/inventory-adjustment.entity";
import { AdjustmentType } from "../domain/enums/adjustment-type.enum";

export interface CreateInventoryAdjustmentInput {
  tenantId: bigint;
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  adjustmentType: AdjustmentType;
  quantity: string;
  reason: string;
  remarks?: string | null;
  createdBy?: bigint | null;
}

export interface CreateInventoryAdjustmentDeps {
  repository: IInventoryRepository;
}

export async function createInventoryAdjustment(
  input: CreateInventoryAdjustmentInput,
  deps: CreateInventoryAdjustmentDeps,
): Promise<InventoryAdjustment> {
  return deps.repository.createInventoryAdjustment(input.tenantId, {
    companyUuid: input.companyUuid,
    warehouseUuid: input.warehouseUuid,
    productId: input.productId,
    adjustmentType: input.adjustmentType,
    quantity: input.quantity,
    reason: input.reason,
    remarks: input.remarks ?? null,
    createdBy: input.createdBy ?? null,
  });
}
