// Business layer — records a new Batch/Lot (00_BUSINESS_RULES.md Ch.40) for
// a Product held at a Warehouse. `companyUuid`/`warehouseUuid` are
// cross-module/in-module uuid references (FK-002) and `productId` is a
// real, in-module FK — none of the three are validated for existence here,
// mirroring every other Inventory create service's handling of its own
// cross-reference fields (e.g. create-stock.service.ts, whose analogous
// design decision this mirrors verbatim).
//
// Enforces only the one rule Ch.40.8 states directly for Batch itself: "if
// provided, [expiry date] must be after the manufacture date" — when both
// dates are supplied, a manufacture date after (or equal to — see
// InvalidBatchDateRangeError's own header comment) the expiry date is
// rejected via InvalidBatchDateRangeError. Neither date is mandatory
// (Ch.40.3 never states either is), so no check runs unless both are
// present.
//
// Deliberately NOT done here, per explicit instruction: no BAT-001
// enforcement (a Batch-tracked Product's every Stock Movement must
// reference a Batch — a Stock Movement-side concern, not a Batch-creation
// one), no BAT-002 (FEFO selection), no BAT-003 (expired-Batch block), and
// no Product/Stock Movement integration of any kind.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Batch } from "../domain/entities/batch.entity";
import { BatchStatus } from "../domain/enums/batch-status.enum";
import { InvalidBatchDateRangeError } from "../domain/errors/inventory.errors";

export interface CreateBatchInput {
  tenantId: bigint;
  companyUuid: string;
  productId: bigint;
  warehouseUuid: string;
  batchNumber: string;
  manufactureDate?: Date | null;
  expiryDate?: Date | null;
  quantity?: string;
  status?: BatchStatus;
  createdBy?: bigint | null;
}

export interface CreateBatchDeps {
  repository: IInventoryRepository;
}

export async function createBatch(input: CreateBatchInput, deps: CreateBatchDeps): Promise<Batch> {
  if (input.manufactureDate && input.expiryDate && input.manufactureDate > input.expiryDate) {
    throw new InvalidBatchDateRangeError(input.manufactureDate, input.expiryDate);
  }

  return deps.repository.createBatch(input.tenantId, {
    companyUuid: input.companyUuid,
    productId: input.productId,
    warehouseUuid: input.warehouseUuid,
    batchNumber: input.batchNumber,
    manufactureDate: input.manufactureDate ?? null,
    expiryDate: input.expiryDate ?? null,
    quantity: input.quantity,
    status: input.status,
    createdBy: input.createdBy ?? null,
  });
}
