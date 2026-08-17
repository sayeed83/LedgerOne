import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TenantResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { tenantQueryKey } from "./use-tenant";

// Ch.1.6 Tenant lifecycle: Provisioning/Suspended -> Active -> Suspended ->
// Deactivated (terminal). Three thin mutations sharing the same
// invalidation, mirroring the backend's own three separate endpoints.
function useLifecycleMutation(tenantUuid: string, action: (uuid: string) => Promise<TenantResponseDto>) {
  const queryClient = useQueryClient();
  return useMutation<TenantResponseDto, ApiError, void>({
    mutationFn: () => action(tenantUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKey(tenantUuid) }),
  });
}

export function useActivateTenant(tenantUuid: string) {
  return useLifecycleMutation(tenantUuid, organizationService.activateTenant);
}

export function useSuspendTenant(tenantUuid: string) {
  return useLifecycleMutation(tenantUuid, organizationService.suspendTenant);
}

export function useDeactivateTenant(tenantUuid: string) {
  return useLifecycleMutation(tenantUuid, organizationService.deactivateTenant);
}
