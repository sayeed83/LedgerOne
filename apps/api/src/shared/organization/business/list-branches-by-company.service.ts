// Business layer — lists every Branch registered under a Company
// (00_BUSINESS_RULES.md BRN-001). The supplied Company must exist under the
// supplied Tenant.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Branch } from "../domain/entities/branch.entity";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";

export interface ListBranchesByCompanyInput {
  tenantUuid: string;
  companyUuid: string;
}

export interface ListBranchesByCompanyDeps {
  repository: IOrganizationRepository;
}

export async function listBranchesByCompany(
  input: ListBranchesByCompanyInput,
  deps: ListBranchesByCompanyDeps,
): Promise<Branch[]> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  return repository.listBranchesByCompany(tenant.id, company.id);
}
