import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BranchResponseDto, CreateBranchRequestDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { branchesQueryKey } from "./use-branches";

export function useCreateBranch(tenantUuid: string, companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<BranchResponseDto, ApiError, CreateBranchRequestDto>({
    mutationFn: (payload) => organizationService.createBranch(tenantUuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchesQueryKey(companyUuid) }),
  });
}
