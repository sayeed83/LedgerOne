// Mirrors apps/api/src/shared/authorization/domain/enums/role-status.enum.ts.
export enum RoleStatus {
  Active = "ACTIVE",
  Retired = "RETIRED",
}

// Mirrors presentation/dto/responses/role.response.dto.ts.
export interface RoleResponseDto {
  uuid: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  status: RoleStatus;
  createdAt: string;
  updatedAt: string;
}

// Mirrors presentation/dto/responses/user-role.response.dto.ts — a User↔Role
// assignment (00_BUSINESS_RULES.md Ch.11.10).
export interface UserRoleResponseDto {
  uuid: string;
  userUuid: string;
  roleUuid: string;
  createdAt: string;
}

// Mirrors presentation/dto/requests/assign-role.dto.ts.
export interface AssignRoleRequestDto {
  roleUuid: string;
}
