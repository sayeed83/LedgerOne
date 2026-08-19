// Business layer — revises an existing Batch's own editable fields
// (00_BUSINESS_RULES.md Ch.40): `batchNumber`, `manufactureDate`,
// `expiryDate`, `quantity`, `status` — exactly the fields `UpdateBatchProps`
// (the Repository layer's own update surface) already supports.
//
// `manufactureDate`/`expiryDate` follow the `undefined`-leaves-untouched /
// explicit-value-or-`null`-clears convention already used by
// update-unit.service.ts's own `baseUnitUuid`/`conversionFactor` fields.
// Ch.40.8's "expiry date, if provided, must be after the manufacture date"
// is re-checked here against the *effective* dates — the newly supplied
// value if given, otherwise the Batch's own existing value — mirroring
// update-product-category.service.ts's effective-value pattern, so that
// changing only one of the two dates cannot silently produce an invalid
// pair.
//
// Deliberately NOT done here, per explicit instruction: no BAT-001/BAT-002/
// BAT-003 enforcement and no Product/Stock Movement integration.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Batch } from "../domain/entities/batch.entity";
import { BatchStatus } from "../domain/enums/batch-status.enum";
import { BatchNotFoundError, InvalidBatchDateRangeError } from "../domain/errors/inventory.errors";

export interface UpdateBatchInput {
  tenantId: bigint;
  batchUuid: string;
  batchNumber?: string;
  manufactureDate?: Date | null;
  expiryDate?: Date | null;
  quantity?: string;
  status?: BatchStatus;
  updatedBy?: bigint | null;
}

export interface UpdateBatchDeps {
  repository: IInventoryRepository;
}

export async function updateBatch(input: UpdateBatchInput, deps: UpdateBatchDeps): Promise<Batch> {
  const { repository } = deps;

  const batch = await repository.findBatchByUuid(input.tenantId, input.batchUuid);
  if (!batch) {
    throw new BatchNotFoundError(input.batchUuid);
  }

  const effectiveManufactureDate =
    input.manufactureDate !== undefined ? input.manufactureDate : batch.manufactureDate;
  const effectiveExpiryDate = input.expiryDate !== undefined ? input.expiryDate : batch.expiryDate;

  if (effectiveManufactureDate && effectiveExpiryDate && effectiveManufactureDate > effectiveExpiryDate) {
    throw new InvalidBatchDateRangeError(effectiveManufactureDate, effectiveExpiryDate);
  }

  return repository.updateBatch(input.tenantId, batch.uuid, {
    batchNumber: input.batchNumber,
    manufactureDate: input.manufactureDate,
    expiryDate: input.expiryDate,
    quantity: input.quantity,
    status: input.status,
    updatedBy: input.updatedBy ?? null,
  });
}
