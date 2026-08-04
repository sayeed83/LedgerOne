// Business layer — revises a Tenant's identifying details. Status is never
// changed here (see activate/suspend/deactivate-tenant.service.ts) — this
// use case only touches `legalName`/`primaryContactEmail`
// (00_BUSINESS_RULES.md Ch.1.9).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Tenant } from "../domain/aggregates/tenant.aggregate";
import { TenantNotFoundError } from "../domain/errors/organization.errors";

export interface UpdateTenantInput {
  tenantUuid: string;
  legalName?: string;
  primaryContactEmail?: string;
  updatedBy?: bigint | null;
}

export interface UpdateTenantDeps {
  repository: IOrganizationRepository;
}

export async function updateTenant(input: UpdateTenantInput, deps: UpdateTenantDeps): Promise<Tenant> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  return repository.updateTenant(tenant.id, {
    legalName: input.legalName,
    primaryContactEmail: input.primaryContactEmail,
    updatedBy: input.updatedBy ?? null,
  });
}
