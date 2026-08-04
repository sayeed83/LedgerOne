import { useMutation } from "@tanstack/react-query";
import type { RefreshResponseDto } from "@ledgerone/shared-types";
import * as authenticationService from "@/services/authentication.service";
import type { ApiError } from "@/services/api-client";

// Exchanges the httpOnly refresh-token cookie for a new access token.
// Used by AuthProvider both to silently hydrate a session on load and to
// proactively refresh ahead of the 15-minute access-token expiry.
export function useRefreshToken() {
  return useMutation<RefreshResponseDto, ApiError, void>({
    mutationFn: () => authenticationService.refresh(),
  });
}
