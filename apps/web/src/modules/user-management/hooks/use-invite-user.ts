import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InviteUserRequestDto, UserResponseDto } from "@ledgerone/shared-types";
import * as userManagementService from "@/services/user-management.service";
import type { ApiError } from "@/services/api-client";

// Ch.10.6 onboarding: new Users are created via the Invite flow
// (`POST /users/invite`) rather than the plain `createUser` endpoint —
// both share an identical request shape on the backend, but Invite is the
// business-intended entry point for adding a User to a Tenant.
export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation<UserResponseDto, ApiError, InviteUserRequestDto>({
    mutationFn: (payload) => userManagementService.inviteUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-management", "users"] }),
  });
}
