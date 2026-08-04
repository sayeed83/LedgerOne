import { useMutation } from "@tanstack/react-query";
import type { ForgotPasswordRequestDto, MessageResponseDto } from "@ledgerone/shared-types";
import * as authenticationService from "@/services/authentication.service";
import type { ApiError } from "@/services/api-client";

export function useForgotPassword() {
  return useMutation<MessageResponseDto, ApiError, ForgotPasswordRequestDto>({
    mutationFn: (payload) => authenticationService.forgotPassword(payload),
  });
}
