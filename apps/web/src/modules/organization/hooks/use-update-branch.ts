import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BranchResponseDto, UpdateBranchRequestDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { branchQueryKey } from "./use-branch";
import { branchesQueryKey } from "./use-branches";

// `companyUuid` is optional: the Branch response itself never carries it
// (the backend's own documented omission, mirroring Fiscal Period/Exchange
// Rate's "omit the parent id rather than pay an extra lookup" choice), so a
// caller reaching this Branch directly (not from an already-loaded list)
// may not know it — that caller's own list view simply won't be
// invalidated, which is a strict subset of always invalidating it.
export function useUpdateBranch(tenantUuid: string, branchUuid: string, companyUuid?: string) {
  const queryClient = useQueryClient();
  return useMutation<BranchResponseDto, ApiError, UpdateBranchRequestDto>({
    mutationFn: (payload) => organizationService.updateBranch(tenantUuid, branchUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchQueryKey(branchUuid) });
      if (companyUuid) {
        queryClient.invalidateQueries({ queryKey: branchesQueryKey(companyUuid) });
      }
    },
  });
}
