import { useQuery } from "@tanstack/react-query";
import type { UserResponseDto } from "@ledgerone/shared-types";
import * as userManagementService from "@/services/user-management.service";
import type { ApiError } from "@/services/api-client";

export function userQueryKey(userUuid: string) {
  return ["user-management", "user", userUuid] as const;
}

export function useUser(userUuid: string | null) {
  return useQuery<UserResponseDto, ApiError>({
    queryKey: userQueryKey(userUuid ?? ""),
    queryFn: () => userManagementService.getUser(userUuid as string),
    enabled: Boolean(userUuid),
  });
}
