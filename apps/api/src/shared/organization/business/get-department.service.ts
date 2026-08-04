// Business layer — reads a Department by its external identifier, scoped
// to the supplied Tenant (00_BUSINESS_RULES.md DPT-001). Never resolves by
// the internal `id` (06_DATABASE_STANDARDS.md PK-003).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Department } from "../domain/entities/department.entity";
import { TenantNotFoundError, DepartmentNotFoundError } from "../domain/errors/organization.errors";

export interface GetDepartmentInput {
  tenantUuid: string;
  departmentUuid: string;
}

export interface GetDepartmentDeps {
  repository: IOrganizationRepository;
}

export async function getDepartment(input: GetDepartmentInput, deps: GetDepartmentDeps): Promise<Department> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const department = await repository.findDepartmentByUuid(tenant.id, input.departmentUuid);
  if (!department) {
    throw new DepartmentNotFoundError(input.departmentUuid);
  }

  return department;
}
