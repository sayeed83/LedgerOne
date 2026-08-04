// Business layer — registers a new Company under a Tenant
// (00_BUSINESS_RULES.md CMP-001: exactly one Organization, no
// reassignment). The Company code must be unique within the Tenant
// (06_DATABASE_STANDARDS.md unique constraint on `(tenantId, companyCode)`)
// — checked here rather than left to a raw Prisma constraint violation
// bubbling out of the Repository layer (05_CODING_STANDARDS.md Ch.18.3).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Company } from "../domain/aggregates/company.aggregate";
import { TenantNotFoundError, DuplicateCompanyCodeError } from "../domain/errors/organization.errors";

export interface CreateCompanyInput {
  tenantUuid: string;
  companyCode: string;
  legalName: string;
  displayName?: string | null;
  legalEntityType?: string | null;
  taxRegistrationNumber: string;
  baseCurrencyCode: string;
  country: string;
  timeZone: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
  createdBy?: bigint | null;
}

export interface CreateCompanyDeps {
  repository: IOrganizationRepository;
}

export async function createCompany(input: CreateCompanyInput, deps: CreateCompanyDeps): Promise<Company> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const existingCompanies = await repository.listCompaniesByTenant(tenant.id);
  if (existingCompanies.some((company) => company.companyCode === input.companyCode)) {
    throw new DuplicateCompanyCodeError(input.companyCode);
  }

  return repository.createCompany(tenant.id, {
    companyCode: input.companyCode,
    legalName: input.legalName,
    displayName: input.displayName ?? null,
    legalEntityType: input.legalEntityType ?? null,
    taxRegistrationNumber: input.taxRegistrationNumber,
    baseCurrencyCode: input.baseCurrencyCode,
    country: input.country,
    timeZone: input.timeZone,
    financialYearStartMonth: input.financialYearStartMonth,
    financialYearStartDay: input.financialYearStartDay,
    createdBy: input.createdBy ?? null,
  });
}
