// Business layer — lists every Company registered under a Tenant
// (00_BUSINESS_RULES.md CMP-001).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Company } from "../domain/aggregates/company.aggregate";
import { TenantNotFoundError } from "../domain/errors/organization.errors";

export interface ListCompaniesByTenantInput {
  tenantUuid: string;
}

export interface ListCompaniesByTenantDeps {
  repository: IOrganizationRepository;
}

export async function listCompaniesByTenant(
  input: ListCompaniesByTenantInput,
  deps: ListCompaniesByTenantDeps,
): Promise<Company[]> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  return repository.listCompaniesByTenant(tenant.id);
}
