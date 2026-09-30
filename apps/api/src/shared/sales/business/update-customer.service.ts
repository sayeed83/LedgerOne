// Business layer — revises a Customer's name/address/credit limit/payment
// terms/status (00_BUSINESS_RULES.md Ch.45.5). Re-checks CUS-001's
// name-uniqueness-within-Company rule whenever `name` is actually changing
// — mirroring update-product.service.ts's own "only re-check when the
// relevant field changes" pattern. `companyUuid` is not an updatable field
// here, mirroring Product's own `UpdateProductProps` (no `companyUuid`) —
// Ch.45 documents no Customer-reassigned-to-a-different-Company workflow,
// so the duplicate-name check is always evaluated against the Customer's
// existing (fixed) `companyUuid`.
//
// Deliberately NOT enforced here, per explicit instruction: status-transition
// validation (Ch.45.5's Prospect/Active/OnHold/Inactive workflow), CUS-002
// (credit limit vs outstanding balance), Price List (Ch.46) and Business
// Location (Ch.9) validation — all future-chapter or later-milestone
// concerns. `status`/`creditLimit`/`paymentTerms` are therefore accepted and
// passed straight through with no transition/threshold validation, flagged
// rather than silently invented, mirroring Product's own PRD-003/Ch.34.12
// deferral.
import { ISalesRepository } from "../domain/interfaces/sales-repository.interface";
import { Customer } from "../domain/entities/customer.entity";
import { CustomerStatus } from "../domain/enums/customer-status.enum";
import { CustomerNotFoundError, CustomerAlreadyExistsError } from "../domain/errors/sales.errors";

export interface UpdateCustomerInput {
  tenantId: bigint;
  customerUuid: string;
  name?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  creditLimit?: string;
  paymentTerms?: string | null;
  status?: CustomerStatus;
  updatedBy?: bigint | null;
}

export interface UpdateCustomerDeps {
  repository: ISalesRepository;
}

export async function updateCustomer(input: UpdateCustomerInput, deps: UpdateCustomerDeps): Promise<Customer> {
  const { repository } = deps;

  const customer = await repository.findCustomerByUuid(input.tenantId, input.customerUuid);
  if (!customer) {
    throw new CustomerNotFoundError(input.customerUuid);
  }

  if (input.name !== undefined && input.name !== customer.name) {
    const existing = await repository.findCustomerByName(input.tenantId, customer.companyUuid, input.name);
    if (existing) {
      throw new CustomerAlreadyExistsError(customer.companyUuid, input.name);
    }
  }

  return repository.updateCustomer(input.tenantId, customer.uuid, {
    name: input.name,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    region: input.region,
    postalCode: input.postalCode,
    countryCode: input.countryCode,
    creditLimit: input.creditLimit,
    paymentTerms: input.paymentTerms,
    status: input.status,
    updatedBy: input.updatedBy ?? null,
  });
}
