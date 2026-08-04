// Business layer — transitions a Tenant to Suspended (00_BUSINESS_RULES.md
// Ch.1.6): valid only from Active (subscription lapse/payment failure). The
// Domain aggregate's `suspend()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Tenant } from "../domain/aggregates/tenant.aggregate";
import { TenantNotFoundError } from "../domain/errors/organization.errors";

export interface SuspendTenantInput {
  tenantUuid: string;
  updatedBy?: bigint | null;
}

export interface SuspendTenantDeps {
  repository: IOrganizationRepository;
}

export async function suspendTenant(input: SuspendTenantInput, deps: SuspendTenantDeps): Promise<Tenant> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const suspended = tenant.suspend();
  return repository.updateTenantStatus(tenant.id, suspended.status, input.updatedBy ?? null);
}
