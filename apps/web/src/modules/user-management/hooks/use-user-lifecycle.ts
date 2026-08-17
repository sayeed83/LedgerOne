import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserResponseDto } from "@ledgerone/shared-types";
import * as userManagementService from "@/services/user-management.service";
import type { ApiError } from "@/services/api-client";
import { userQueryKey } from "./use-user";

// Ch.10.5 User lifecycle: Invited/Suspended -> Active, Active -> Suspended,
// Active -> Deactivated (terminal). Mirrors Organization's
// use-company-lifecycle.ts shared-mutation-factory pattern.
function useLifecycleMutation(userUuid: string, action: (userUuid: string) => Promise<UserResponseDto>) {
  const queryClient = useQueryClient();
  return useMutation<UserResponseDto, ApiError, void>({
    mutationFn: () => action(userUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey(userUuid) });
      queryClient.invalidateQueries({ queryKey: ["user-management", "users"] });
    },
  });
}

export function useActivateUser(userUuid: string) {
  return useLifecycleMutation(userUuid, userManagementService.activateUser);
}

export function useSuspendUser(userUuid: string) {
  return useLifecycleMutation(userUuid, userManagementService.suspendUser);
}

export function useDeactivateUser(userUuid: string) {
  return useLifecycleMutation(userUuid, userManagementService.deactivateUser);
}
