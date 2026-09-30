// Business layer — defines a new Customer for a Company
// (00_BUSINESS_RULES.md Ch.45.1). CUS-001 ("every Customer belongs to
// exactly one Company") is enforced here as name-uniqueness within that
// Company via `findCustomerByName`, mirroring
// create-product.service.ts's own PRD-001 duplicate-code check pattern,
// using `CustomerAlreadyExistsError`.
//
// Deliberately NOT enforced here, per explicit instruction to implement only
// the rules authorized for this milestone: CUS-002 (credit limit vs
// outstanding balance — no Sales Order/Invoice exists yet to evaluate it
// against), Price List (Ch.46) and Business Location (Ch.9) validation
// (neither has a schema of its own yet), and any Ch.45.5 lifecycle/status
// workflow. `companyUuid` is a cross-module reference (FK-002) to
// Organization's `companies.uuid`; its existence is not validated here,
// mirroring every Inventory create service's `companyUuid` handling.
import { ISalesRepository } from "../domain/interfaces/sales-repository.interface";
import { Customer } from "../domain/entities/customer.entity";
import { CustomerStatus } from "../domain/enums/customer-status.enum";
import { CustomerAlreadyExistsError } from "../domain/errors/sales.errors";

export interface CreateCustomerInput {
  tenantId: bigint;
  companyUuid: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  creditLimit?: string;
  paymentTerms?: string | null;
  status?: CustomerStatus;
  createdBy?: bigint | null;
}

export interface CreateCustomerDeps {
  repository: ISalesRepository;
}

export async function createCustomer(input: CreateCustomerInput, deps: CreateCustomerDeps): Promise<Customer> {
  const { repository } = deps;

  const existing = await repository.findCustomerByName(input.tenantId, input.companyUuid, input.name);
  if (existing) {
    throw new CustomerAlreadyExistsError(input.companyUuid, input.name);
  }

  return repository.createCustomer(input.tenantId, {
    companyUuid: input.companyUuid,
    name: input.name,
    addressLine1: input.addressLine1 ?? null,
    addressLine2: input.addressLine2 ?? null,
    city: input.city ?? null,
    region: input.region ?? null,
    postalCode: input.postalCode ?? null,
    countryCode: input.countryCode ?? null,
    creditLimit: input.creditLimit,
    paymentTerms: input.paymentTerms ?? null,
    status: input.status,
    createdBy: input.createdBy ?? null,
  });
}
