// Business layer — registers a new Branch under a Company
// (00_BUSINESS_RULES.md BRN-001: exactly one Company, no reassignment). The
// supplied Company must exist under the supplied Tenant, and the Branch
// code must be unique within that Company (06_DATABASE_STANDARDS.md unique
// constraint on `(companyId, branchCode)`) — checked here rather than left
// to a raw Prisma constraint violation (05_CODING_STANDARDS.md Ch.18.3).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Branch } from "../domain/entities/branch.entity";
import { TenantNotFoundError, CompanyNotFoundError, DuplicateBranchCodeError } from "../domain/errors/organization.errors";

export interface CreateBranchInput {
  tenantUuid: string;
  companyUuid: string;
  branchCode: string;
  branchName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  timeZone: string;
  createdBy?: bigint | null;
}

export interface CreateBranchDeps {
  repository: IOrganizationRepository;
}

export async function createBranch(input: CreateBranchInput, deps: CreateBranchDeps): Promise<Branch> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  const existingBranches = await repository.listBranchesByCompany(tenant.id, company.id);
  if (existingBranches.some((branch) => branch.branchCode === input.branchCode)) {
    throw new DuplicateBranchCodeError(input.branchCode);
  }

  return repository.createBranch(tenant.id, company.id, {
    branchCode: input.branchCode,
    branchName: input.branchName,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 ?? null,
    city: input.city,
    region: input.region ?? null,
    postalCode: input.postalCode ?? null,
    countryCode: input.countryCode,
    timeZone: input.timeZone,
    createdBy: input.createdBy ?? null,
  });
}
