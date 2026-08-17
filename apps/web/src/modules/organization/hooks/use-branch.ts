import { useQuery } from "@tanstack/react-query";
import type { BranchResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

export function branchQueryKey(branchUuid: string) {
  return ["organization", "branch", branchUuid] as const;
}

export function useBranch(tenantUuid: string | null, branchUuid: string | null) {
  return useQuery<BranchResponseDto, ApiError>({
    queryKey: branchQueryKey(branchUuid ?? ""),
    queryFn: () => organizationService.getBranch(tenantUuid as string, branchUuid as string),
    enabled: Boolean(tenantUuid) && Boolean(branchUuid),
  });
}
