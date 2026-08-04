// Business layer — transitions a Company to Closed (00_BUSINESS_RULES.md
// Ch.2.6): valid from Active only. The Domain aggregate's `close()`
// enforces the transition is legal (05_CODING_STANDARDS.md Ch.15.4) before
// this use case persists it.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Company } from "../domain/aggregates/company.aggregate";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";

export interface CloseCompanyInput {
  tenantUuid: string;
  companyUuid: string;
  updatedBy?: bigint | null;
}

export interface CloseCompanyDeps {
  repository: IOrganizationRepository;
}

export async function closeCompany(input: CloseCompanyInput, deps: CloseCompanyDeps): Promise<Company> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  company.close();
  return repository.deactivateCompany(tenant.id, company.uuid, input.updatedBy ?? null);
}
