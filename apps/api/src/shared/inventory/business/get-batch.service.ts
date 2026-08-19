// Business layer — reads a Batch by its external identifier, scoped to the
// supplied Tenant (00_BUSINESS_RULES.md Ch.40). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Batch } from "../domain/entities/batch.entity";
import { BatchNotFoundError } from "../domain/errors/inventory.errors";

export interface GetBatchInput {
  tenantId: bigint;
  batchUuid: string;
}

export interface GetBatchDeps {
  repository: IInventoryRepository;
}

export async function getBatch(input: GetBatchInput, deps: GetBatchDeps): Promise<Batch> {
  const batch = await deps.repository.findBatchByUuid(input.tenantId, input.batchUuid);
  if (!batch) {
    throw new BatchNotFoundError(input.batchUuid);
  }
  return batch;
}
