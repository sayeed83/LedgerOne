import { useQuery } from "@tanstack/react-query";
import type { PermissionResponseDto } from "@ledgerone/shared-types";
import * as authorizationService from "@/services/authorization.service";
import type { ApiError } from "@/services/api-client";

// Permission is platform-owned, read-only reference data (MT-005/PRM-001) —
// no create/update/delete hook exists for it, mirroring the backend's own
// read-only surface.
export function permissionsQueryKey(moduleName?: string) {
  return ["authorization", "permissions", moduleName ?? "all"] as const;
}

export function usePermissions(moduleName?: string) {
  return useQuery<PermissionResponseDto[], ApiError>({
    queryKey: permissionsQueryKey(moduleName),
    queryFn: () => authorizationService.listPermissions(moduleName),
  });
}
