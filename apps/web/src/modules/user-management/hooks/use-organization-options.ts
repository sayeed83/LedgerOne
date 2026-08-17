import { useQuery } from "@tanstack/react-query";
import type { BranchResponseDto, CompanyResponseDto, DepartmentResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

// ARCH-004: User Management's screens/forms never import from
// `modules/organization/*` — a User's Company/Branch/Department are
// cross-module references (FK-002), so these thin, module-local hooks
// reach the shared `services/organization.service.ts` chokepoint directly
// (the same shared layer Organization's own hooks call), rather than
// importing Organization's own hooks/components.
export function useCompanyOptions(tenantUuid: string | null) {
  return useQuery<CompanyResponseDto[], ApiError>({
    queryKey: ["organization", "companies", tenantUuid ?? ""],
    queryFn: () => organizationService.listCompaniesByTenant(tenantUuid as string),
    enabled: Boolean(tenantUuid),
  });
}

export function useBranchOptions(tenantUuid: string | null, companyUuid: string | null) {
  return useQuery<BranchResponseDto[], ApiError>({
    queryKey: ["organization", "branches", companyUuid ?? ""],
    queryFn: () => organizationService.listBranchesByCompany(tenantUuid as string, companyUuid as string),
    enabled: Boolean(tenantUuid) && Boolean(companyUuid),
  });
}

export function useDepartmentOptions(tenantUuid: string | null, companyUuid: string | null) {
  return useQuery<DepartmentResponseDto[], ApiError>({
    queryKey: ["organization", "departments", companyUuid ?? ""],
    queryFn: () => organizationService.listDepartmentsByCompany(tenantUuid as string, companyUuid as string),
    enabled: Boolean(tenantUuid) && Boolean(companyUuid),
  });
}
