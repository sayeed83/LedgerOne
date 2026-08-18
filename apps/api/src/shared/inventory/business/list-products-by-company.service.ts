// Business layer — lists every Product belonging to a single Company
// (00_BUSINESS_RULES.md Ch.34.1), scoped to a Tenant. `companyUuid` is
// required, not optional — a distinct use case from a tenant-wide list,
// mirroring the Repository layer's own `listProductsByCompany` shape.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Product } from "../domain/entities/product.entity";

export interface ListProductsByCompanyInput {
  tenantId: bigint;
  companyUuid: string;
}

export interface ListProductsByCompanyDeps {
  repository: IInventoryRepository;
}

export async function listProductsByCompany(
  input: ListProductsByCompanyInput,
  deps: ListProductsByCompanyDeps,
): Promise<Product[]> {
  return deps.repository.listProductsByCompany(input.tenantId, input.companyUuid);
}
