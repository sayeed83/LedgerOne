// Business layer — defines a new Reorder Level for a Product in a Warehouse
// (00_BUSINESS_RULES.md Ch.42.1). ROL-101 ("A Reorder Level is defined per
// Product per Warehouse") is enforced here via
// `findReorderLevelByWarehouseAndProduct`, mirroring
// create-stock.service.ts's own STK-003 duplicate-pair check, using
// `ReorderLevelAlreadyExistsError`. Ch.42.8 ("Reorder Level must be a
// non-negative quantity") is enforced here via
// `InvalidReorderLevelQuantityError` — the suggested reorder quantity
// "should be positive" is deliberately NOT enforced as a hard validation:
// unlike "must", the handbook's own "should" language elsewhere (e.g.
// Ch.17.8's "should be descriptive enough") is advisory, not a
// system-enforced rule, so `reorderQuantity` carries no equivalent check
// here — not a silent omission.
//
// `companyUuid`/`warehouseUuid` are cross-module/in-module uuid-reference
// fields (FK-002); `productId` is a real, in-module FK — none of the three
// is validated for existence here, mirroring every other Inventory create
// service's handling of its own cross-module/FK reference fields. This
// service depends only on `IInventoryRepository`.
//
// Deliberately NOT implemented here, per explicit instruction — these
// belong to later chapters/milestones: reading current Stock quantity,
// determining whether Stock is below the configured threshold, generating
// a reorder alert (ROL-102), creating a Purchase Requisition, scheduling
// any job, or sending any notification.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ReorderLevel } from "../domain/entities/reorder-level.entity";
import { ReorderLevelAlreadyExistsError, InvalidReorderLevelQuantityError } from "../domain/errors/inventory.errors";

/** Ch.42.8: "Reorder Level must be a non-negative quantity." No leading '-'; zero is allowed. */
function isNonNegativeDecimalString(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value);
}

export interface CreateReorderLevelInput {
  tenantId: bigint;
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  reorderLevel: string;
  reorderQuantity: string;
  createdBy?: bigint | null;
}

export interface CreateReorderLevelDeps {
  repository: IInventoryRepository;
}

export async function createReorderLevel(
  input: CreateReorderLevelInput,
  deps: CreateReorderLevelDeps,
): Promise<ReorderLevel> {
  const { repository } = deps;

  if (!isNonNegativeDecimalString(input.reorderLevel)) {
    throw new InvalidReorderLevelQuantityError(input.reorderLevel);
  }

  const existing = await repository.findReorderLevelByWarehouseAndProduct(
    input.tenantId,
    input.warehouseUuid,
    input.productId,
  );
  if (existing) {
    throw new ReorderLevelAlreadyExistsError(input.warehouseUuid, input.productId);
  }

  return repository.createReorderLevel(input.tenantId, {
    companyUuid: input.companyUuid,
    warehouseUuid: input.warehouseUuid,
    productId: input.productId,
    reorderLevel: input.reorderLevel,
    reorderQuantity: input.reorderQuantity,
    createdBy: input.createdBy ?? null,
  });
}
