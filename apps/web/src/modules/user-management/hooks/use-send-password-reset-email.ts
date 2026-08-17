import { useMutation } from "@tanstack/react-query";
import type { MessageResponseDto } from "@ledgerone/shared-types";
import * as authenticationService from "@/services/authentication.service";
import type { ApiError } from "@/services/api-client";
import { decodeSessionTenantId } from "../utils/decode-session-tenant-id";

// See decode-session-tenant-id.ts for why this reuses Authentication's
// self-service forgot-password flow rather than a dedicated admin
// "reset password" endpoint (none exists on the backend today).
export function useSendPasswordResetEmail() {
  return useMutation<MessageResponseDto, ApiError, string>({
    mutationFn: (email) => {
      const tenantId = decodeSessionTenantId();
      if (!tenantId) {
        return Promise.reject<MessageResponseDto>({
          status: 0,
          code: "NETWORK_ERROR",
          message: "Could not determine your current Tenant from the active session.",
        });
      }
      return authenticationService.forgotPassword({ tenantId, email });
    },
  });
}
