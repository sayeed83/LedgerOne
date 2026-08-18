// Business layer — reads a Unit by its external identifier, scoped to the
// supplied Tenant (00_BUSINESS_RULES.md Ch.36.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Unit } from "../domain/entities/unit.entity";
import { UnitNotFoundError } from "../domain/errors/inventory.errors";

export interface GetUnitInput {
  tenantId: bigint;
  unitUuid: string;
}

export interface GetUnitDeps {
  repository: IInventoryRepository;
}

export async function getUnit(input: GetUnitInput, deps: GetUnitDeps): Promise<Unit> {
  const unit = await deps.repository.findUnitByUuid(input.tenantId, input.unitUuid);
  if (!unit) {
    throw new UnitNotFoundError(input.unitUuid);
  }
  return unit;
}
