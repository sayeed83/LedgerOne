// Business layer — lists every Unit belonging to a single Company
// (00_BUSINESS_RULES.md Ch.36.1), scoped to a Tenant. `companyUuid` is
// required, not optional — a distinct use case from a tenant-wide list,
// mirroring the Repository layer's own `listUnitsByCompany` shape.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Unit } from "../domain/entities/unit.entity";

export interface ListUnitsByCompanyInput {
  tenantId: bigint;
  companyUuid: string;
}

export interface ListUnitsByCompanyDeps {
  repository: IInventoryRepository;
}

export async function listUnitsByCompany(input: ListUnitsByCompanyInput, deps: ListUnitsByCompanyDeps): Promise<Unit[]> {
  return deps.repository.listUnitsByCompany(input.tenantId, input.companyUuid);
}
