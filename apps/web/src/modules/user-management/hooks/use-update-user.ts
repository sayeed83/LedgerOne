import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserRequestDto, UserResponseDto } from "@ledgerone/shared-types";
import * as userManagementService from "@/services/user-management.service";
import type { ApiError } from "@/services/api-client";
import { userQueryKey } from "./use-user";

export function useUpdateUser(userUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<UserResponseDto, ApiError, UpdateUserRequestDto>({
    mutationFn: (payload) => userManagementService.updateUser(userUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey(userUuid) });
      queryClient.invalidateQueries({ queryKey: ["user-management", "users"] });
    },
  });
}
