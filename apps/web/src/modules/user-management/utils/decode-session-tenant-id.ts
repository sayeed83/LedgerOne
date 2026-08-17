import { getAccessToken } from "@/services/api-client";

// Handbook Deviation, flagged not guessed: the "Send Password Reset Email"
// action reuses Authentication's existing self-service
// `POST /auth/forgot-password` (see forgot-password.dto.ts), which is
// unauthenticated and requires an explicit numeric `tenantId` in its body —
// there is no admin-initiated password-reset endpoint in the backend today
// (Authentication's forgot/reset-password flow is entirely self-service,
// token-based). No frontend context currently holds this numeric tenant id
// (`useCurrentTenant()` only stores Organization's Tenant *uuid*), but the
// currently authenticated session's access token already carries it as its
// `tenantId` claim (apps/api's token-issuer signs `{ sub, tenantId }`) — so
// this reads it directly off the in-memory access token rather than
// inventing a new backend contract or a duplicate tenant-context store.
export function decodeSessionTenantId(): string | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    return null;
  }
  try {
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const claims = JSON.parse(json) as { tenantId?: string };
    return typeof claims.tenantId === "string" ? claims.tenantId : null;
  } catch {
    return null;
  }
}
