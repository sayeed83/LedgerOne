// Business layer — lists every Warehouse belonging to a single Branch
// (00_BUSINESS_RULES.md Ch.37.1, WHS-001), scoped to a Tenant.
// `branchUuid` is required, not optional — a distinct use case from a
// tenant-wide list, mirroring the Repository layer's own
// `listWarehousesByBranch` shape and list-products-by-company.service.ts's
// own `companyUuid`-required convention.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Warehouse } from "../domain/entities/warehouse.entity";

export interface ListWarehousesByBranchInput {
  tenantId: bigint;
  branchUuid: string;
}

export interface ListWarehousesByBranchDeps {
  repository: IInventoryRepository;
}

export async function listWarehousesByBranch(
  input: ListWarehousesByBranchInput,
  deps: ListWarehousesByBranchDeps,
): Promise<Warehouse[]> {
  return deps.repository.listWarehousesByBranch(input.tenantId, input.branchUuid);
}
