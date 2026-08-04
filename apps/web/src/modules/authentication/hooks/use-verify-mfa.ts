import { useMutation } from "@tanstack/react-query";
import type { AuthenticatedResponseDto, VerifyMfaRequestDto } from "@ledgerone/shared-types";
import * as authenticationService from "@/services/authentication.service";
import type { ApiError } from "@/services/api-client";

export function useVerifyMfa() {
  return useMutation<AuthenticatedResponseDto, ApiError, VerifyMfaRequestDto>({
    mutationFn: (payload) => authenticationService.verifyMfa(payload),
  });
}
