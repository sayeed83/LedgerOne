// Business layer — reads a Reorder Level by its external identifier, scoped
// to the supplied Tenant (00_BUSINESS_RULES.md Ch.42). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ReorderLevel } from "../domain/entities/reorder-level.entity";
import { ReorderLevelNotFoundError } from "../domain/errors/inventory.errors";

export interface GetReorderLevelInput {
  tenantId: bigint;
  reorderLevelUuid: string;
}

export interface GetReorderLevelDeps {
  repository: IInventoryRepository;
}

export async function getReorderLevel(input: GetReorderLevelInput, deps: GetReorderLevelDeps): Promise<ReorderLevel> {
  const reorderLevel = await deps.repository.findReorderLevelByUuid(input.tenantId, input.reorderLevelUuid);
  if (!reorderLevel) {
    throw new ReorderLevelNotFoundError(input.reorderLevelUuid);
  }
  return reorderLevel;
}
