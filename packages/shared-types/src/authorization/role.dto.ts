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

// Mirrors presentation/dto/requests/create-role.dto.ts. `isSystemRole` is
// deliberately not accepted here — every Role created through this endpoint
// defaults to false at the Business layer (00_BUSINESS_RULES.md ROL-002:
// only LedgerOne's own platform seeding creates a standard/system Role).
export interface CreateRoleRequestDto {
  name: string;
  description?: string | null;
}

// Mirrors presentation/dto/requests/update-role.dto.ts. `status` is never
// changed here — only via the dedicated `retire` transition.
export interface UpdateRoleRequestDto {
  name?: string;
  description?: string | null;
}
