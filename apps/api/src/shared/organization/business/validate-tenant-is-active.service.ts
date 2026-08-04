// Business layer — the guard other modules' use cases call before allowing a
// tenant-scoped business operation to proceed (00_BUSINESS_RULES.md Ch.1.6's
// "Can Users Transact?" column: only Active permits transacting). Read-only.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Tenant } from "../domain/aggregates/tenant.aggregate";
import { TenantStatus } from "../domain/enums/tenant-status.enum";
import { TenantNotActiveError, TenantNotFoundError } from "../domain/errors/organization.errors";

export interface ValidateTenantIsActiveInput {
  tenantUuid: string;
}

export interface ValidateTenantIsActiveDeps {
  repository: IOrganizationRepository;
}

export async function validateTenantIsActive(
  input: ValidateTenantIsActiveInput,
  deps: ValidateTenantIsActiveDeps,
): Promise<Tenant> {
  const tenant = await deps.repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  if (tenant.status !== TenantStatus.Active) {
    throw new TenantNotActiveError(tenant.uuid, tenant.status);
  }

  return tenant;
}
