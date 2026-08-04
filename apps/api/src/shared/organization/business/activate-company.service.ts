// Business layer — transitions a Company to Active (00_BUSINESS_RULES.md
// Ch.2.6): valid from Draft (initial activation) or Closed (reopening). The
// Domain aggregate's `activate()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Company } from "../domain/aggregates/company.aggregate";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";

export interface ActivateCompanyInput {
  tenantUuid: string;
  companyUuid: string;
  updatedBy?: bigint | null;
}

export interface ActivateCompanyDeps {
  repository: IOrganizationRepository;
}

export async function activateCompany(input: ActivateCompanyInput, deps: ActivateCompanyDeps): Promise<Company> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  company.activate();
  return repository.activateCompany(tenant.id, company.uuid, input.updatedBy ?? null);
}
