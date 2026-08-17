import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TenantResponseDto, UpdateTenantRequestDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { tenantQueryKey } from "./use-tenant";

export function useUpdateTenant(tenantUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TenantResponseDto, ApiError, UpdateTenantRequestDto>({
    mutationFn: (payload) => organizationService.updateTenant(tenantUuid, payload),
    // TQ-003: invalidate exactly the affected key, never a blanket invalidate-all.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKey(tenantUuid) }),
  });
}
