import type {
  CreateUserRequestDto,
  InviteUserRequestDto,
  UpdateUserRequestDto,
  UserResponseDto,
} from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002: sole API wrapper for the User Management module — every
// function returns the unwrapped `data` payload. Unlike Organization's
// service, no explicit `X-Tenant-Id` header is attached here: User
// Management is mounted behind `createCurrentTenantMiddleware({
// rewriteHeaderAs: "decimal" })` (apps/api/src/module-registry.ts), which
// unconditionally derives and overwrites the header from the verified JWT
// before this module's own schema ever inspects it — any client-sent value
// would be discarded anyway (API-004).
export async function createUser(payload: CreateUserRequestDto): Promise<UserResponseDto> {
  const response = await apiClient.post<Envelope<UserResponseDto>>("/users", payload);
  return response.data.data;
}

export async function inviteUser(payload: InviteUserRequestDto): Promise<UserResponseDto> {
  const response = await apiClient.post<Envelope<UserResponseDto>>("/users/invite", payload);
  return response.data.data;
}

export async function getUser(userUuid: string): Promise<UserResponseDto> {
  const response = await apiClient.get<Envelope<UserResponseDto>>(`/users/${userUuid}`);
  return response.data.data;
}

export async function updateUser(userUuid: string, payload: UpdateUserRequestDto): Promise<UserResponseDto> {
  const response = await apiClient.put<Envelope<UserResponseDto>>(`/users/${userUuid}`, payload);
  return response.data.data;
}

// TBL-003: the backend returns a Tenant's Users unpaginated — a documented,
// flagged gap on the backend side (list-users.controller.ts), not an
// application of the small-dataset exception. Client-side pagination is
// the only option available, mirroring Organization's own list screens.
export async function listUsers(companyUuid?: string): Promise<UserResponseDto[]> {
  const response = await apiClient.get<Envelope<UserResponseDto[]>>("/users", {
    params: companyUuid ? { companyUuid } : undefined,
  });
  return response.data.data;
}

export async function searchUsers(query: string): Promise<UserResponseDto[]> {
  const response = await apiClient.get<Envelope<UserResponseDto[]>>("/users/search", {
    params: { query },
  });
  return response.data.data;
}

export async function activateUser(userUuid: string): Promise<UserResponseDto> {
  const response = await apiClient.post<Envelope<UserResponseDto>>(`/users/${userUuid}/activate`);
  return response.data.data;
}

export async function suspendUser(userUuid: string): Promise<UserResponseDto> {
  const response = await apiClient.post<Envelope<UserResponseDto>>(`/users/${userUuid}/suspend`);
  return response.data.data;
}

export async function deactivateUser(userUuid: string): Promise<UserResponseDto> {
  const response = await apiClient.post<Envelope<UserResponseDto>>(`/users/${userUuid}/deactivate`);
  return response.data.data;
}
