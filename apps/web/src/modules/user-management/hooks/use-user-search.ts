import { useQuery } from "@tanstack/react-query";
import type { UserResponseDto } from "@ledgerone/shared-types";
import * as userManagementService from "@/services/user-management.service";
import type { ApiError } from "@/services/api-client";

export function userSearchQueryKey(query: string) {
  return ["user-management", "users", "search", query] as const;
}

// Routes through the backend's dedicated `GET /users/search?query=`
// endpoint rather than filtering the already-fetched list client-side, so
// search behaves consistently even once the unpaginated-list gap is fixed.
export function useUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery<UserResponseDto[], ApiError>({
    queryKey: userSearchQueryKey(trimmed),
    queryFn: () => userManagementService.searchUsers(trimmed),
    enabled: trimmed.length > 0,
  });
}
