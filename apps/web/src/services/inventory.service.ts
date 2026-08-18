import type { CreateUnitRequestDto, UnitResponseDto, UpdateUnitRequestDto } from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002/ARCH-003: the sole API wrapper for the Inventory module.
// API-004: the active tenant is derived from the JWT by
// `current-tenant.middleware.ts` server-side — no `X-Tenant-Id` header is
// set by this file, mirroring accounting.service.ts's identical reasoning.
// `companyUuid` below is a legitimate request field (which Company a Unit
// belongs to), not the tenant-context concept API-004 forbids passing
// explicitly.

// --- Unit of Measure ---

export async function listUnitsByCompany(companyUuid: string): Promise<UnitResponseDto[]> {
  const response = await apiClient.get<Envelope<UnitResponseDto[]>>("/inventory/units", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function listBaseUnits(companyUuid: string): Promise<UnitResponseDto[]> {
  const response = await apiClient.get<Envelope<UnitResponseDto[]>>("/inventory/units/base-units", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function getUnit(unitUuid: string): Promise<UnitResponseDto> {
  const response = await apiClient.get<Envelope<UnitResponseDto>>(`/inventory/units/${unitUuid}`);
  return response.data.data;
}

export async function createUnit(payload: CreateUnitRequestDto): Promise<UnitResponseDto> {
  const response = await apiClient.post<Envelope<UnitResponseDto>>("/inventory/units", payload);
  return response.data.data;
}

export async function updateUnit(unitUuid: string, payload: UpdateUnitRequestDto): Promise<UnitResponseDto> {
  const response = await apiClient.put<Envelope<UnitResponseDto>>(`/inventory/units/${unitUuid}`, payload);
  return response.data.data;
}
