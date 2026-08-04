import { useMutation } from "@tanstack/react-query";
import type { LoginRequestDto, LoginResponseDto } from "@ledgerone/shared-types";
import * as authenticationService from "@/services/authentication.service";
import type { ApiError } from "@/services/api-client";

export function useLogin() {
  return useMutation<LoginResponseDto, ApiError, LoginRequestDto>({
    mutationFn: (payload) => authenticationService.login(payload),
  });
}
