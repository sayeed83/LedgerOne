import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateRoleRequestDto, RoleResponseDto } from "@ledgerone/shared-types";
import * as authorizationService from "@/services/authorization.service";
import type { ApiError } from "@/services/api-client";

// Same query key shape User Management's own `use-roles.ts` already uses
// for its "Assign Roles" feature (`["authorization", "roles"]`) — sharing
// the literal key means both modules' caches invalidate together, not a
// coincidence to avoid, since they read the exact same tenant-wide list.
export function rolesQueryKey() {
  return ["authorization", "roles"] as const;
}

export function useRoles() {
  return useQuery<RoleResponseDto[], ApiError>({
    queryKey: rolesQueryKey(),
    queryFn: () => authorizationService.listRoles(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation<RoleResponseDto, ApiError, CreateRoleRequestDto>({
    mutationFn: (payload) => authorizationService.createRole(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesQueryKey() }),
  });
}
