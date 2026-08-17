import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RoleResponseDto, UserRoleResponseDto } from "@ledgerone/shared-types";
import * as authorizationService from "@/services/authorization.service";
import type { ApiError } from "@/services/api-client";

export function userRolesQueryKey(userUuid: string) {
  return ["authorization", "user-roles", userUuid] as const;
}

export function useUserRoles(userUuid: string | null) {
  return useQuery<RoleResponseDto[], ApiError>({
    queryKey: userRolesQueryKey(userUuid ?? ""),
    queryFn: () => authorizationService.listUserRoles(userUuid as string),
    enabled: Boolean(userUuid),
  });
}

export function useAssignRole(userUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<UserRoleResponseDto, ApiError, string>({
    mutationFn: (roleUuid) => authorizationService.assignRole(userUuid, roleUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userRolesQueryKey(userUuid) }),
  });
}

export function useRemoveRole(userUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (roleUuid) => authorizationService.removeRole(userUuid, roleUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userRolesQueryKey(userUuid) }),
  });
}
