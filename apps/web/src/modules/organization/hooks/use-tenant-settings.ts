import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTenantSettingsRequestDto,
  TenantSettingsResponseDto,
  UpdateTenantSettingsRequestDto,
} from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

// TQ-002: hierarchical query key, mirrors `use-tenant.ts`'s own shape.
export function tenantSettingsQueryKey(tenantUuid: string) {
  return ["organization", "tenant-settings", tenantUuid] as const;
}

// Ch.1.7/ORG-003. A 404 here (`ORG_TENANT_SETTINGS_NOT_FOUND`) is an
// expected, real state — not every Tenant has completed this onboarding
// step yet (see current-phase.md's own documented provisioning-gap fix) —
// `TenantScreen.tsx` renders that as a "set up Settings" prompt, not a
// hard error.
export function useTenantSettings(tenantUuid: string | null) {
  return useQuery<TenantSettingsResponseDto, ApiError>({
    queryKey: tenantSettingsQueryKey(tenantUuid ?? ""),
    queryFn: () => organizationService.getTenantSettings(tenantUuid as string),
    enabled: Boolean(tenantUuid),
    retry: false,
  });
}

export function useCreateTenantSettings(tenantUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TenantSettingsResponseDto, ApiError, CreateTenantSettingsRequestDto>({
    mutationFn: (payload) => organizationService.createTenantSettings(tenantUuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantSettingsQueryKey(tenantUuid) }),
  });
}

export function useUpdateTenantSettings(tenantUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TenantSettingsResponseDto, ApiError, UpdateTenantSettingsRequestDto>({
    mutationFn: (payload) => organizationService.updateTenantSettings(tenantUuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantSettingsQueryKey(tenantUuid) }),
  });
}
