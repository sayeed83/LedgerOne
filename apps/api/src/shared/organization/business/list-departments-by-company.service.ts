// Business layer — lists every Department registered under a Company
// (00_BUSINESS_RULES.md DPT-001). The supplied Company must exist under
// the supplied Tenant.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Department } from "../domain/entities/department.entity";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";

export interface ListDepartmentsByCompanyInput {
  tenantUuid: string;
  companyUuid: string;
}

export interface ListDepartmentsByCompanyDeps {
  repository: IOrganizationRepository;
}

export async function listDepartmentsByCompany(
  input: ListDepartmentsByCompanyInput,
  deps: ListDepartmentsByCompanyDeps,
): Promise<Department[]> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  return repository.listDepartmentsByCompany(tenant.id, company.id);
}
