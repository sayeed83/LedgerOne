import { useQuery } from "@tanstack/react-query";
import type { TenantResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

// TQ-002: hierarchical query key.
export function tenantQueryKey(tenantUuid: string) {
  return ["organization", "tenant", tenantUuid] as const;
}

export function useTenant(tenantUuid: string | null) {
  return useQuery<TenantResponseDto, ApiError>({
    queryKey: tenantQueryKey(tenantUuid ?? ""),
    queryFn: () => organizationService.getTenant(tenantUuid as string),
    enabled: Boolean(tenantUuid),
  });
}
