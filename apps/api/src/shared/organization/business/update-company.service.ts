// Business layer — revises a Company's identifying details. Status is never
// changed here (see activate/close-company.service.ts). If `companyCode` is
// being changed, the new code must still be unique within the Tenant
// (mirrors create-company.service.ts's check).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Company } from "../domain/aggregates/company.aggregate";
import { TenantNotFoundError, CompanyNotFoundError, DuplicateCompanyCodeError } from "../domain/errors/organization.errors";

export interface UpdateCompanyInput {
  tenantUuid: string;
  companyUuid: string;
  companyCode?: string;
  legalName?: string;
  displayName?: string | null;
  legalEntityType?: string | null;
  taxRegistrationNumber?: string;
  baseCurrencyCode?: string;
  country?: string;
  timeZone?: string;
  financialYearStartMonth?: number;
  financialYearStartDay?: number;
  updatedBy?: bigint | null;
}

export interface UpdateCompanyDeps {
  repository: IOrganizationRepository;
}

export async function updateCompany(input: UpdateCompanyInput, deps: UpdateCompanyDeps): Promise<Company> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  if (input.companyCode && input.companyCode !== company.companyCode) {
    const existingCompanies = await repository.listCompaniesByTenant(tenant.id);
    if (existingCompanies.some((other) => other.uuid !== company.uuid && other.companyCode === input.companyCode)) {
      throw new DuplicateCompanyCodeError(input.companyCode);
    }
  }

  return repository.updateCompany(tenant.id, company.uuid, {
    companyCode: input.companyCode,
    legalName: input.legalName,
    displayName: input.displayName,
    legalEntityType: input.legalEntityType,
    taxRegistrationNumber: input.taxRegistrationNumber,
    baseCurrencyCode: input.baseCurrencyCode,
    country: input.country,
    timeZone: input.timeZone,
    financialYearStartMonth: input.financialYearStartMonth,
    financialYearStartDay: input.financialYearStartDay,
    updatedBy: input.updatedBy ?? null,
  });
}
