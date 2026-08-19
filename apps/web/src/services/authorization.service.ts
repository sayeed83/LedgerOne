import type {
  AssignPermissionRequestDto,
  CreateRoleRequestDto,
  PermissionResponseDto,
  RolePermissionResponseDto,
  RoleResponseDto,
  UpdateRoleRequestDto,
  UserRoleResponseDto,
} from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002: sole API wrapper for the Authorization module. No
// explicit `X-Tenant-Id` header is attached: this module is mounted behind
// the same `createCurrentTenantMiddleware({ rewriteHeaderAs: "decimal" })`
// as User Management, which derives/overwrites the header from the
// verified JWT server-side (API-004). `GET /permissions` is the one
// platform-owned exception (MT-005) but needs no special handling here
// either — the header is simply never inspected for that route.

// --- Role ---

export async function listRoles(): Promise<RoleResponseDto[]> {
  const response = await apiClient.get<Envelope<RoleResponseDto[]>>("/authorization/roles");
  return response.data.data;
}

export async function getRole(roleUuid: string): Promise<RoleResponseDto> {
  const response = await apiClient.get<Envelope<RoleResponseDto>>(`/authorization/roles/${roleUuid}`);
  return response.data.data;
}

export async function createRole(payload: CreateRoleRequestDto): Promise<RoleResponseDto> {
  const response = await apiClient.post<Envelope<RoleResponseDto>>("/authorization/roles", payload);
  return response.data.data;
}

export async function updateRole(roleUuid: string, payload: UpdateRoleRequestDto): Promise<RoleResponseDto> {
  const response = await apiClient.put<Envelope<RoleResponseDto>>(`/authorization/roles/${roleUuid}`, payload);
  return response.data.data;
}

export async function retireRole(roleUuid: string): Promise<RoleResponseDto> {
  const response = await apiClient.post<Envelope<RoleResponseDto>>(`/authorization/roles/${roleUuid}/retire`);
  return response.data.data;
}

// --- Permission (platform-owned, read-only — no create/update/delete endpoint exists) ---

export async function listPermissions(moduleName?: string): Promise<PermissionResponseDto[]> {
  const response = await apiClient.get<Envelope<PermissionResponseDto[]>>("/authorization/permissions", {
    params: moduleName ? { moduleName } : undefined,
  });
  return response.data.data;
}

// --- Role Permissions ---

export async function listRolePermissions(roleUuid: string): Promise<PermissionResponseDto[]> {
  const response = await apiClient.get<Envelope<PermissionResponseDto[]>>(
    `/authorization/roles/${roleUuid}/permissions`,
  );
  return response.data.data;
}

export async function assignPermission(
  roleUuid: string,
  payload: AssignPermissionRequestDto,
): Promise<RolePermissionResponseDto> {
  const response = await apiClient.post<Envelope<RolePermissionResponseDto>>(
    `/authorization/roles/${roleUuid}/permissions`,
    payload,
  );
  return response.data.data;
}

export async function removePermission(roleUuid: string, permissionKey: string): Promise<void> {
  await apiClient.delete(`/authorization/roles/${roleUuid}/permissions/${encodeURIComponent(permissionKey)}`);
}

// --- User Roles ---

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
