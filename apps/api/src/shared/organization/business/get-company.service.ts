// Business layer — reads a Company by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md CMP-001). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Company } from "../domain/aggregates/company.aggregate";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";

export interface GetCompanyInput {
  tenantUuid: string;
  companyUuid: string;
}

export interface GetCompanyDeps {
  repository: IOrganizationRepository;
}

export async function getCompany(input: GetCompanyInput, deps: GetCompanyDeps): Promise<Company> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  return company;
}
