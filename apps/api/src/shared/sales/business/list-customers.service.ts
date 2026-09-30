// Business layer — lists every Customer within a Tenant, across every
// Company (00_BUSINESS_RULES.md Ch.45.1), mirroring `listRoles`'s own
// tenant-wide pass-through shape (authorization module).
import { ISalesRepository } from "../domain/interfaces/sales-repository.interface";
import { Customer } from "../domain/entities/customer.entity";

export interface ListCustomersInput {
  tenantId: bigint;
}

export interface ListCustomersDeps {
  repository: ISalesRepository;
}

export async function listCustomers(input: ListCustomersInput, deps: ListCustomersDeps): Promise<Customer[]> {
  return deps.repository.listCustomers(input.tenantId);
}
