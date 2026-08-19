import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTenantSubscriptionRequestDto,
  TenantSubscriptionResponseDto,
  UpdateTenantSubscriptionRequestDto,
} from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";

// TQ-002: hierarchical query key, mirrors `use-tenant-settings.ts`'s own shape.
export function tenantSubscriptionQueryKey(tenantUuid: string) {
  return ["organization", "tenant-subscription", tenantUuid] as const;
}

// Ch.1.4/ORG-004. A 404 here (`ORG_TENANT_SUBSCRIPTION_NOT_FOUND`) is an
// expected, real state, same reasoning as `use-tenant-settings.ts`.
export function useTenantSubscription(tenantUuid: string | null) {
  return useQuery<TenantSubscriptionResponseDto, ApiError>({
    queryKey: tenantSubscriptionQueryKey(tenantUuid ?? ""),
    queryFn: () => organizationService.getTenantSubscription(tenantUuid as string),
    enabled: Boolean(tenantUuid),
    retry: false,
  });
}

export function useCreateTenantSubscription(tenantUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TenantSubscriptionResponseDto, ApiError, CreateTenantSubscriptionRequestDto>({
    mutationFn: (payload) => organizationService.createTenantSubscription(tenantUuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantSubscriptionQueryKey(tenantUuid) }),
  });
}

export function useUpdateTenantSubscription(tenantUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TenantSubscriptionResponseDto, ApiError, UpdateTenantSubscriptionRequestDto>({
    mutationFn: (payload) => organizationService.updateTenantSubscription(tenantUuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantSubscriptionQueryKey(tenantUuid) }),
  });
}
