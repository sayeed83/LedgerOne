// Business layer — transitions a Tenant to Active (00_BUSINESS_RULES.md
// Ch.1.6): valid from Provisioning (onboarding complete) or Suspended
// (subscription reinstated). The Domain aggregate's `activate()` enforces
// the transition is legal (05_CODING_STANDARDS.md Ch.15.4) before this use
// case persists it.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Tenant } from "../domain/aggregates/tenant.aggregate";
import { TenantNotFoundError } from "../domain/errors/organization.errors";

export interface ActivateTenantInput {
  tenantUuid: string;
  updatedBy?: bigint | null;
}

export interface ActivateTenantDeps {
  repository: IOrganizationRepository;
}

export async function activateTenant(input: ActivateTenantInput, deps: ActivateTenantDeps): Promise<Tenant> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const activated = tenant.activate();
  return repository.updateTenantStatus(tenant.id, activated.status, input.updatedBy ?? null);
}
