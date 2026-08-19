// Business layer — lists every Reorder Level belonging to a single Company,
// across every Warehouse (00_BUSINESS_RULES.md Ch.42), scoped to a Tenant.
// Plain Repository passthrough, mirroring
// list-reorder-levels-by-warehouse.service.ts's own shape.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ReorderLevel } from "../domain/entities/reorder-level.entity";

export interface ListReorderLevelsByCompanyInput {
  tenantId: bigint;
  companyUuid: string;
}

export interface ListReorderLevelsByCompanyDeps {
  repository: IInventoryRepository;
}

export async function listReorderLevelsByCompany(
  input: ListReorderLevelsByCompanyInput,
  deps: ListReorderLevelsByCompanyDeps,
): Promise<ReorderLevel[]> {
  return deps.repository.listReorderLevelsByCompany(input.tenantId, input.companyUuid);
}
