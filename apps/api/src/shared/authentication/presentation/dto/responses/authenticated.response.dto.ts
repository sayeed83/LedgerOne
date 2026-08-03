import { z } from "zod";

// The refresh token is never present in this body (SESS-001/SESS-002) — it
// travels only via the httpOnly Set-Cookie header
// (support/refresh-token-cookie.ts). Used for both the password-login
// success path and the MFA-verify success path (spec §5) since they return
// the same shape.
export const authenticatedResponseSchema = z.object({
  accessToken: z.string(),
});

export type AuthenticatedResponse = z.infer<typeof authenticatedResponseSchema>;
