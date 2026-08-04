// Business layer — revises a Department's identifying details. Status
// transitions are not part of this milestone (mirrors the Repository
// interface, 05_CODING_STANDARDS.md Ch.14.4). If `departmentCode` is being
// changed, the new code must still be unique within the Department's
// Company (mirrors create-department.service.ts's check).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Department } from "../domain/entities/department.entity";
import { TenantNotFoundError, DepartmentNotFoundError, DuplicateDepartmentCodeError } from "../domain/errors/organization.errors";

export interface UpdateDepartmentInput {
  tenantUuid: string;
  departmentUuid: string;
  departmentCode?: string;
  departmentName?: string;
  updatedBy?: bigint | null;
}

export interface UpdateDepartmentDeps {
  repository: IOrganizationRepository;
}

export async function updateDepartment(input: UpdateDepartmentInput, deps: UpdateDepartmentDeps): Promise<Department> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const department = await repository.findDepartmentByUuid(tenant.id, input.departmentUuid);
  if (!department) {
    throw new DepartmentNotFoundError(input.departmentUuid);
  }

  if (input.departmentCode && input.departmentCode !== department.departmentCode) {
    const existingDepartments = await repository.listDepartmentsByCompany(tenant.id, department.companyId);
    if (
      existingDepartments.some(
        (other) => other.uuid !== department.uuid && other.departmentCode === input.departmentCode,
      )
    ) {
      throw new DuplicateDepartmentCodeError(input.departmentCode);
    }
  }

  return repository.updateDepartment(tenant.id, department.uuid, {
    departmentCode: input.departmentCode,
    departmentName: input.departmentName,
    updatedBy: input.updatedBy ?? null,
  });
}
