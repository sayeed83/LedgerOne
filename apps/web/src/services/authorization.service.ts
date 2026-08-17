import type { RoleResponseDto, UserRoleResponseDto } from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002: sole API wrapper for the Authorization module. Scoped
// deliberately narrow — only the Role-listing and User↔Role assignment
// endpoints User Management's "Assign Roles" feature needs; Role
// CRUD/Permission management belong to Authorization's own future frontend
// milestone. No explicit `X-Tenant-Id` header is attached: this module is
// mounted behind the same `createCurrentTenantMiddleware({ rewriteHeaderAs:
// "decimal" })` as User Management, which derives/overwrites the header
// from the verified JWT server-side (API-004).
export async function listRoles(): Promise<RoleResponseDto[]> {
  const response = await apiClient.get<Envelope<RoleResponseDto[]>>("/authorization/roles");
  return response.data.data;
}

export async function listUserRoles(userUuid: string): Promise<RoleResponseDto[]> {
  const response = await apiClient.get<Envelope<RoleResponseDto[]>>(`/authorization/users/${userUuid}/roles`);
  return response.data.data;
}

export async function assignRole(userUuid: string, roleUuid: string): Promise<UserRoleResponseDto> {
  const response = await apiClient.post<Envelope<UserRoleResponseDto>>(`/authorization/users/${userUuid}/roles`, {
    roleUuid,
  });
  return response.data.data;
}

export async function removeRole(userUuid: string, roleUuid: string): Promise<void> {
  await apiClient.delete(`/authorization/users/${userUuid}/roles/${roleUuid}`);
}
