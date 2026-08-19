import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RoleResponseDto, UpdateRoleRequestDto } from "@ledgerone/shared-types";
import * as authorizationService from "@/services/authorization.service";
import type { ApiError } from "@/services/api-client";
import { rolesQueryKey } from "./use-roles";

export function roleQueryKey(roleUuid: string) {
  return ["authorization", "role", roleUuid] as const;
}

export function useRole(roleUuid: string | null) {
  return useQuery<RoleResponseDto, ApiError>({
    queryKey: roleQueryKey(roleUuid ?? ""),
    queryFn: () => authorizationService.getRole(roleUuid as string),
    enabled: Boolean(roleUuid),
  });
}

export function useUpdateRole(roleUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<RoleResponseDto, ApiError, UpdateRoleRequestDto>({
    mutationFn: (payload) => authorizationService.updateRole(roleUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKey(roleUuid) });
      queryClient.invalidateQueries({ queryKey: rolesQueryKey() });
    },
  });
}

// Ch.11.5 lifecycle: Active → Retired only, one direction, no reverse
// transition — mirrors Currency's own `activate`/`deactivate` pair but as a
// single one-way action (Role has no "reactivate").
export function useRetireRole(roleUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<RoleResponseDto, ApiError, void>({
    mutationFn: () => authorizationService.retireRole(roleUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKey(roleUuid) });
      queryClient.invalidateQueries({ queryKey: rolesQueryKey() });
    },
  });
}
