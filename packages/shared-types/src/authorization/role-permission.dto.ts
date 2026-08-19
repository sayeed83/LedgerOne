// Mirrors presentation/dto/responses/role-permission.response.dto.ts — a
// Role↔Permission grant (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10).
export interface RolePermissionResponseDto {
  uuid: string;
  roleUuid: string;
  permissionKey: string;
  createdAt: string;
}

// Mirrors presentation/dto/requests/assign-permission.dto.ts.
export interface AssignPermissionRequestDto {
  permissionKey: string;
}
