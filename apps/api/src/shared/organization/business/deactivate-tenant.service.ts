// Business layer — transitions a Tenant to Deactivated (00_BUSINESS_RULES.md
// Ch.1.6): valid from Active (subscription cancelled) or Suspended (grace
// period expired). The Domain aggregate's `deactivate()` enforces the
// transition is legal (05_CODING_STANDARDS.md Ch.15.4) before this use case
// persists it.
//
// ORG-005's cascade ("deactivating an Organization deactivates every
// Company, Branch, Department, and User beneath it simultaneously") is not
// implemented here — Company/Branch/Department/User are owned by modules
// that do not exist yet in this codebase. Once they do, this use case
// publishes a Domain Event after commit (05_CODING_STANDARDS.md Ch.20.4) for
// those modules to react to, rather than reaching into their tables directly
// (Ch.11 — no cross-module repository access).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Tenant } from "../domain/aggregates/tenant.aggregate";
import { TenantNotFoundError } from "../domain/errors/organization.errors";

export interface DeactivateTenantInput {
  tenantUuid: string;
  updatedBy?: bigint | null;
}

export interface DeactivateTenantDeps {
  repository: IOrganizationRepository;
}

export async function deactivateTenant(input: DeactivateTenantInput, deps: DeactivateTenantDeps): Promise<Tenant> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const deactivated = tenant.deactivate();
  return repository.updateTenantStatus(tenant.id, deactivated.status, input.updatedBy ?? null);
}
