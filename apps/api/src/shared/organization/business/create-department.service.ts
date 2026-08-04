// Business layer — registers a new Department under a Company
// (00_BUSINESS_RULES.md DPT-001: exactly one Company). The supplied
// Company must exist under the supplied Tenant, and the Department code
// must be unique within that Company (06_DATABASE_STANDARDS.md unique
// constraint on `(companyId, departmentCode)`) — checked here rather than
// left to a raw Prisma constraint violation (05_CODING_STANDARDS.md Ch.18.3).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Department } from "../domain/entities/department.entity";
import { TenantNotFoundError, CompanyNotFoundError, DuplicateDepartmentCodeError } from "../domain/errors/organization.errors";

export interface CreateDepartmentInput {
  tenantUuid: string;
  companyUuid: string;
  departmentCode: string;
  departmentName: string;
  createdBy?: bigint | null;
}

export interface CreateDepartmentDeps {
  repository: IOrganizationRepository;
}

export async function createDepartment(input: CreateDepartmentInput, deps: CreateDepartmentDeps): Promise<Department> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const company = await repository.findCompanyByUuid(tenant.id, input.companyUuid);
  if (!company) {
    throw new CompanyNotFoundError(input.companyUuid);
  }

  const existingDepartments = await repository.listDepartmentsByCompany(tenant.id, company.id);
  if (existingDepartments.some((department) => department.departmentCode === input.departmentCode)) {
    throw new DuplicateDepartmentCodeError(input.departmentCode);
  }

  return repository.createDepartment(tenant.id, company.id, {
    departmentCode: input.departmentCode,
    departmentName: input.departmentName,
    createdBy: input.createdBy ?? null,
  });
}
