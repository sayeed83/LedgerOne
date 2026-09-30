import type {
  CreateCustomerRequestDto,
  CustomerResponseDto,
  UpdateCustomerRequestDto,
} from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002/ARCH-003: the sole API wrapper for the Sales module.
// API-004: the active tenant is derived from the JWT by
// `current-tenant.middleware.ts` server-side — no `X-Tenant-Id` header is
// set by this file, mirroring inventory.service.ts's identical reasoning.
// `companyUuid` below is a legitimate request field (which Company a
// Customer belongs to), not the tenant-context concept API-004 forbids
// passing explicitly.
//
// Sales' backend router is mounted at `/api/v1/customers` directly
// (resource-named, not `/api/v1/sales`) — see module-registry.ts's own
// comment — so every path below is relative to `/customers`, not `/sales`.

// --- Customer ---

export async function listCustomers(): Promise<CustomerResponseDto[]> {
  const response = await apiClient.get<Envelope<CustomerResponseDto[]>>("/customers");
  return response.data.data;
}

export async function listCustomersByCompany(companyUuid: string): Promise<CustomerResponseDto[]> {
  const response = await apiClient.get<Envelope<CustomerResponseDto[]>>("/customers/by-company", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function getCustomer(customerUuid: string): Promise<CustomerResponseDto> {
  const response = await apiClient.get<Envelope<CustomerResponseDto>>(`/customers/${customerUuid}`);
  return response.data.data;
}

export async function createCustomer(payload: CreateCustomerRequestDto): Promise<CustomerResponseDto> {
  const response = await apiClient.post<Envelope<CustomerResponseDto>>("/customers", payload);
  return response.data.data;
}

export async function updateCustomer(
  customerUuid: string,
  payload: UpdateCustomerRequestDto,
): Promise<CustomerResponseDto> {
  const response = await apiClient.put<Envelope<CustomerResponseDto>>(`/customers/${customerUuid}`, payload);
  return response.data.data;
}
