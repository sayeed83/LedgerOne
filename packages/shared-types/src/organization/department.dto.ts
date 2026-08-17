// Mirrors apps/api/src/shared/organization/domain/enums/department-status.enum.ts.
export enum DepartmentStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}

// Mirrors presentation/dto/responses/department.response.dto.ts.
export interface DepartmentResponseDto {
  uuid: string;
  departmentCode: string;
  departmentName: string;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

// `companyUuid` identifies the parent Company and must be supplied in the
// body (the route carries no segment for it), mirroring create-department.dto.ts.
export interface CreateDepartmentRequestDto {
  companyUuid: string;
  departmentCode: string;
  departmentName: string;
}

// No status transitions in this milestone (mirrors update-department.dto.ts).
export interface UpdateDepartmentRequestDto {
  departmentCode?: string;
  departmentName?: string;
}
