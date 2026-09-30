// Business layer — lists every Customer belonging to a single Company
// (00_BUSINESS_RULES.md Ch.45.1), scoped to a Tenant. `companyUuid` is
// required, not optional — a distinct use case from a tenant-wide list,
// mirroring the Repository layer's own `listCustomersByCompany` shape
// (list-products-by-company.service.ts's own identical convention,
// inventory module).
import { ISalesRepository } from "../domain/interfaces/sales-repository.interface";
import { Customer } from "../domain/entities/customer.entity";

export interface ListCustomersByCompanyInput {
  tenantId: bigint;
  companyUuid: string;
}

export interface ListCustomersByCompanyDeps {
  repository: ISalesRepository;
}

export async function listCustomersByCompany(
  input: ListCustomersByCompanyInput,
  deps: ListCustomersByCompanyDeps,
): Promise<Customer[]> {
  return deps.repository.listCustomersByCompany(input.tenantId, input.companyUuid);
}
