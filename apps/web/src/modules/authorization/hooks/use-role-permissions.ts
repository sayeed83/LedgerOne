import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionResponseDto, RolePermissionResponseDto } from "@ledgerone/shared-types";
import * as authorizationService from "@/services/authorization.service";
import type { ApiError } from "@/services/api-client";

export function rolePermissionsQueryKey(roleUuid: string) {
  return ["authorization", "role-permissions", roleUuid] as const;
}

export function useRolePermissions(roleUuid: string | null) {
  return useQuery<PermissionResponseDto[], ApiError>({
    queryKey: rolePermissionsQueryKey(roleUuid ?? ""),
    queryFn: () => authorizationService.listRolePermissions(roleUuid as string),
    enabled: Boolean(roleUuid),
  });
}

export function useAssignPermission(roleUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<RolePermissionResponseDto, ApiError, string>({
    mutationFn: (permissionKey) => authorizationService.assignPermission(roleUuid, { permissionKey }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolePermissionsQueryKey(roleUuid) }),
  });
}

export function useRemovePermission(roleUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (permissionKey) => authorizationService.removePermission(roleUuid, permissionKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolePermissionsQueryKey(roleUuid) }),
  });
}
