// Business layer — revises a Reorder Level's own editable fields
// (00_BUSINESS_RULES.md Ch.42): `reorderLevel`, `reorderQuantity` — exactly
// the fields `UpdateReorderLevelProps` (the Repository layer's own update
// surface) already supports. `warehouseUuid`/`productId` have no field
// here at all — Reorder Level's identity pair is not a Repository-supported
// mutation (mirroring Stock's own `warehouseUuid`/`productId` immutability
// on update), so there is no ROL-101 pair to re-validate on update; ROL-101
// is only ever checked at create time (`create-reorder-level.service.ts`).
//
// Ch.42.8 ("Reorder Level must be a non-negative quantity") is re-checked
// here whenever a new `reorderLevel` is supplied, via
// `InvalidReorderLevelQuantityError` — the same rule `createReorderLevel`
// enforces. `reorderQuantity`'s "should be positive" language remains
// advisory, not enforced, for the identical reason documented in
// `create-reorder-level.service.ts`'s own header comment.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ReorderLevel } from "../domain/entities/reorder-level.entity";
import { ReorderLevelNotFoundError, InvalidReorderLevelQuantityError } from "../domain/errors/inventory.errors";

/** Ch.42.8: "Reorder Level must be a non-negative quantity." No leading '-'; zero is allowed. */
function isNonNegativeDecimalString(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value);
}

export interface UpdateReorderLevelInput {
  tenantId: bigint;
  reorderLevelUuid: string;
  reorderLevel?: string;
  reorderQuantity?: string;
  updatedBy?: bigint | null;
}

export interface UpdateReorderLevelDeps {
  repository: IInventoryRepository;
}

export async function updateReorderLevel(
  input: UpdateReorderLevelInput,
  deps: UpdateReorderLevelDeps,
): Promise<ReorderLevel> {
  const { repository } = deps;

  const reorderLevel = await repository.findReorderLevelByUuid(input.tenantId, input.reorderLevelUuid);
  if (!reorderLevel) {
    throw new ReorderLevelNotFoundError(input.reorderLevelUuid);
  }

  if (input.reorderLevel !== undefined && !isNonNegativeDecimalString(input.reorderLevel)) {
    throw new InvalidReorderLevelQuantityError(input.reorderLevel);
  }

  return repository.updateReorderLevel(input.tenantId, reorderLevel.uuid, {
    reorderLevel: input.reorderLevel,
    reorderQuantity: input.reorderQuantity,
    updatedBy: input.updatedBy ?? null,
  });
}
