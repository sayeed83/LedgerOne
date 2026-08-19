import type {
  BranchResponseDto,
  CompanyResponseDto,
  CreateBranchRequestDto,
  CreateCompanyRequestDto,
  CreateDepartmentRequestDto,
  CreateTenantRequestDto,
  CreateTenantSettingsRequestDto,
  CreateTenantSubscriptionRequestDto,
  DepartmentResponseDto,
  TenantResponseDto,
  TenantSettingsResponseDto,
  TenantSubscriptionResponseDto,
  UpdateBranchRequestDto,
  UpdateCompanyRequestDto,
  UpdateDepartmentRequestDto,
  UpdateTenantRequestDto,
  UpdateTenantSettingsRequestDto,
  UpdateTenantSubscriptionRequestDto,
} from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002: sole API wrapper for the Organization module — every
// function returns the unwrapped `data` payload. Handbook Deviation, flagged
// not guessed (see hooks/use-current-tenant.ts): Company/Branch/Department
// endpoints require an explicit `X-Tenant-Id` header (a real Tenant UUID,
// validated by the backend's own `tenant-id-header.schema.ts`) since no
// JWT-derived tenant-context middleware exists for this module yet — every
// function below that needs one takes `tenantUuid` as an explicit
// parameter and attaches it as a request header, never as a body/query field
// (API-004's "no explicit tenantId" rule is about the numeric legacy claim
// other modules auto-derive from the JWT; this is a different, UUID-shaped
// concept the backend itself expects as a header).
function tenantHeader(tenantUuid: string) {
  return { headers: { "X-Tenant-Id": tenantUuid } };
}

// --- Tenant ---

export async function createTenant(payload: CreateTenantRequestDto): Promise<TenantResponseDto> {
  const response = await apiClient.post<Envelope<TenantResponseDto>>("/organization/tenants", payload);
  return response.data.data;
}

export async function getTenant(tenantUuid: string): Promise<TenantResponseDto> {
  const response = await apiClient.get<Envelope<TenantResponseDto>>(`/organization/tenants/${tenantUuid}`);
  return response.data.data;
}

export async function updateTenant(
  tenantUuid: string,
  payload: UpdateTenantRequestDto,
): Promise<TenantResponseDto> {
  const response = await apiClient.put<Envelope<TenantResponseDto>>(
    `/organization/tenants/${tenantUuid}`,
    payload,
  );
  return response.data.data;
}

export async function activateTenant(tenantUuid: string): Promise<TenantResponseDto> {
  const response = await apiClient.post<Envelope<TenantResponseDto>>(
    `/organization/tenants/${tenantUuid}/activate`,
  );
  return response.data.data;
}

export async function suspendTenant(tenantUuid: string): Promise<TenantResponseDto> {
  const response = await apiClient.post<Envelope<TenantResponseDto>>(
    `/organization/tenants/${tenantUuid}/suspend`,
  );
  return response.data.data;
}

export async function deactivateTenant(tenantUuid: string): Promise<TenantResponseDto> {
  const response = await apiClient.post<Envelope<TenantResponseDto>>(
    `/organization/tenants/${tenantUuid}/deactivate`,
  );
  return response.data.data;
}

// --- Tenant Settings ---
// Ch.1.7/ORG-003: a Tenant's organization-wide defaults. `createTenantSettings`
// provisions the initial row (the backend has no auto-provisioning at
// Tenant-creation time — see current-phase.md's own documented fix) — the
// Organization Administrator's own onboarding step, not a system default.

export async function createTenantSettings(
  tenantUuid: string,
  payload: CreateTenantSettingsRequestDto,
): Promise<TenantSettingsResponseDto> {
  const response = await apiClient.post<Envelope<TenantSettingsResponseDto>>(
    `/organization/tenants/${tenantUuid}/settings`,
    payload,
  );
  return response.data.data;
}

export async function getTenantSettings(tenantUuid: string): Promise<TenantSettingsResponseDto> {
  const response = await apiClient.get<Envelope<TenantSettingsResponseDto>>(
    `/organization/tenants/${tenantUuid}/settings`,
  );
  return response.data.data;
}

export async function updateTenantSettings(
  tenantUuid: string,
  payload: UpdateTenantSettingsRequestDto,
): Promise<TenantSettingsResponseDto> {
  const response = await apiClient.put<Envelope<TenantSettingsResponseDto>>(
    `/organization/tenants/${tenantUuid}/settings`,
    payload,
  );
  return response.data.data;
}

// --- Tenant Subscription ---
// Ch.1.4/ORG-004: a Tenant's commercial subscription record. Same
// provisioning-gap reasoning as Tenant Settings above.

export async function createTenantSubscription(
  tenantUuid: string,
  payload: CreateTenantSubscriptionRequestDto,
): Promise<TenantSubscriptionResponseDto> {
  const response = await apiClient.post<Envelope<TenantSubscriptionResponseDto>>(
    `/organization/tenants/${tenantUuid}/subscription`,
    payload,
  );
  return response.data.data;
}

export async function getTenantSubscription(tenantUuid: string): Promise<TenantSubscriptionResponseDto> {
  const response = await apiClient.get<Envelope<TenantSubscriptionResponseDto>>(
    `/organization/tenants/${tenantUuid}/subscription`,
  );
  return response.data.data;
}

export async function updateTenantSubscription(
  tenantUuid: string,
  payload: UpdateTenantSubscriptionRequestDto,
): Promise<TenantSubscriptionResponseDto> {
  const response = await apiClient.put<Envelope<TenantSubscriptionResponseDto>>(
    `/organization/tenants/${tenantUuid}/subscription`,
    payload,
  );
  return response.data.data;
}

export async function listCompaniesByTenant(tenantUuid: string): Promise<CompanyResponseDto[]> {
  const response = await apiClient.get<Envelope<CompanyResponseDto[]>>(
    `/organization/tenants/${tenantUuid}/companies`,
  );
  return response.data.data;
}

// --- Company ---

export async function createCompany(
  tenantUuid: string,
  payload: CreateCompanyRequestDto,
): Promise<CompanyResponseDto> {
  const response = await apiClient.post<Envelope<CompanyResponseDto>>(
    "/organization/companies",
    payload,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function getCompany(tenantUuid: string, companyUuid: string): Promise<CompanyResponseDto> {
  const response = await apiClient.get<Envelope<CompanyResponseDto>>(
    `/organization/companies/${companyUuid}`,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function updateCompany(
  tenantUuid: string,
  companyUuid: string,
  payload: UpdateCompanyRequestDto,
): Promise<CompanyResponseDto> {
  const response = await apiClient.put<Envelope<CompanyResponseDto>>(
    `/organization/companies/${companyUuid}`,
    payload,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function activateCompany(tenantUuid: string, companyUuid: string): Promise<CompanyResponseDto> {
  const response = await apiClient.post<Envelope<CompanyResponseDto>>(
    `/organization/companies/${companyUuid}/activate`,
    undefined,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function closeCompany(tenantUuid: string, companyUuid: string): Promise<CompanyResponseDto> {
  const response = await apiClient.post<Envelope<CompanyResponseDto>>(
    `/organization/companies/${companyUuid}/close`,
    undefined,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function listBranchesByCompany(tenantUuid: string, companyUuid: string): Promise<BranchResponseDto[]> {
  const response = await apiClient.get<Envelope<BranchResponseDto[]>>(
    `/organization/companies/${companyUuid}/branches`,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function listDepartmentsByCompany(
  tenantUuid: string,
  companyUuid: string,
): Promise<DepartmentResponseDto[]> {
  const response = await apiClient.get<Envelope<DepartmentResponseDto[]>>(
    `/organization/companies/${companyUuid}/departments`,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

// --- Branch ---

export async function createBranch(
  tenantUuid: string,
  payload: CreateBranchRequestDto,
): Promise<BranchResponseDto> {
  const response = await apiClient.post<Envelope<BranchResponseDto>>(
    "/organization/branches",
    payload,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function getBranch(tenantUuid: string, branchUuid: string): Promise<BranchResponseDto> {
  const response = await apiClient.get<Envelope<BranchResponseDto>>(
    `/organization/branches/${branchUuid}`,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function updateBranch(
  tenantUuid: string,
  branchUuid: string,
  payload: UpdateBranchRequestDto,
): Promise<BranchResponseDto> {
  const response = await apiClient.put<Envelope<BranchResponseDto>>(
    `/organization/branches/${branchUuid}`,
    payload,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

// --- Department ---

export async function createDepartment(
  tenantUuid: string,
  payload: CreateDepartmentRequestDto,
): Promise<DepartmentResponseDto> {
  const response = await apiClient.post<Envelope<DepartmentResponseDto>>(
    "/organization/departments",
    payload,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function getDepartment(tenantUuid: string, departmentUuid: string): Promise<DepartmentResponseDto> {
  const response = await apiClient.get<Envelope<DepartmentResponseDto>>(
    `/organization/departments/${departmentUuid}`,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}

export async function updateDepartment(
  tenantUuid: string,
  departmentUuid: string,
  payload: UpdateDepartmentRequestDto,
): Promise<DepartmentResponseDto> {
  const response = await apiClient.put<Envelope<DepartmentResponseDto>>(
    `/organization/departments/${departmentUuid}`,
    payload,
    tenantHeader(tenantUuid),
  );
  return response.data.data;
}
