import { useMutation } from "@tanstack/react-query";
import type { MessageResponseDto, ResetPasswordRequestDto } from "@ledgerone/shared-types";
import * as authenticationService from "@/services/authentication.service";
import type { ApiError } from "@/services/api-client";

export function useResetPassword() {
  return useMutation<MessageResponseDto, ApiError, ResetPasswordRequestDto>({
    mutationFn: (payload) => authenticationService.resetPassword(payload),
  });
}
