// Business layer — reads a Customer by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md Ch.45.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { ISalesRepository } from "../domain/interfaces/sales-repository.interface";
import { Customer } from "../domain/entities/customer.entity";
import { CustomerNotFoundError } from "../domain/errors/sales.errors";

export interface GetCustomerInput {
  tenantId: bigint;
  customerUuid: string;
}

export interface GetCustomerDeps {
  repository: ISalesRepository;
}

export async function getCustomer(input: GetCustomerInput, deps: GetCustomerDeps): Promise<Customer> {
  const customer = await deps.repository.findCustomerByUuid(input.tenantId, input.customerUuid);
  if (!customer) {
    throw new CustomerNotFoundError(input.customerUuid);
  }
  return customer;
}
