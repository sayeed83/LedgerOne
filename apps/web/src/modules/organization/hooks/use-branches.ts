import { useQuery } from "@tanstack/react-query";
import type { BranchResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

export function branchesQueryKey(companyUuid: string) {
  return ["organization", "branches", companyUuid] as const;
}

// TBL-003: the backend returns a Company's Branches unpaginated (a
// documented small-dataset exception) — search/filter/pagination applied
// client-side by the screen.
export function useBranches(tenantUuid: string | null, companyUuid: string | null) {
  return useQuery<BranchResponseDto[], ApiError>({
    queryKey: branchesQueryKey(companyUuid ?? ""),
    queryFn: () => organizationService.listBranchesByCompany(tenantUuid as string, companyUuid as string),
    enabled: Boolean(tenantUuid) && Boolean(companyUuid),
  });
}
