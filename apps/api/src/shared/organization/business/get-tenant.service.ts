// Business layer — reads a Tenant by its external identifier. Never resolves
// by the internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside
// this module only ever hold the `uuid`.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Tenant } from "../domain/aggregates/tenant.aggregate";
import { TenantNotFoundError } from "../domain/errors/organization.errors";

export interface GetTenantInput {
  tenantUuid: string;
}

export interface GetTenantDeps {
  repository: IOrganizationRepository;
}

export async function getTenant(input: GetTenantInput, deps: GetTenantDeps): Promise<Tenant> {
  const tenant = await deps.repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }
  return tenant;
}
