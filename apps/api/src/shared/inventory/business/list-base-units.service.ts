// Business layer — lists every base Unit (a Unit with no `baseUnitId` of
// its own, Ch.36.1/36.11) belonging to a single Company, scoped to a
// Tenant. A plain passthrough to the Repository's own already-filtered
// query — no additional business logic, since "is a base Unit" is fully
// determined by the persisted `baseUnitId IS NULL` condition, not a
// derived/computed business state.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Unit } from "../domain/entities/unit.entity";

export interface ListBaseUnitsInput {
  tenantId: bigint;
  companyUuid: string;
}

export interface ListBaseUnitsDeps {
  repository: IInventoryRepository;
}

export async function listBaseUnits(input: ListBaseUnitsInput, deps: ListBaseUnitsDeps): Promise<Unit[]> {
  return deps.repository.listBaseUnits(input.tenantId, input.companyUuid);
}
