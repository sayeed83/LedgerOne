import { useQuery } from "@tanstack/react-query";
import type { UserResponseDto } from "@ledgerone/shared-types";
import * as userManagementService from "@/services/user-management.service";
import type { ApiError } from "@/services/api-client";

export function usersQueryKey(companyUuid?: string) {
  return ["user-management", "users", "list", companyUuid ?? null] as const;
}

// TBL-003: the backend returns a Tenant's Users unpaginated (a flagged
// backend gap, not a small-dataset exception) — search/filter/pagination
// applied client-side by the screen, same pattern as Organization's lists.
export function useUsers(companyUuid?: string) {
  return useQuery<UserResponseDto[], ApiError>({
    queryKey: usersQueryKey(companyUuid),
    queryFn: () => userManagementService.listUsers(companyUuid),
  });
}
