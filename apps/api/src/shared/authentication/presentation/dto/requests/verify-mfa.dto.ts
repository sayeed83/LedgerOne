import { z } from "zod";

// `tenantId` is not requested here — it is peeked (unverified) from the
// `mfaChallengeToken` itself (support/peek-tenant-id.ts); the Business
// layer re-verifies the token and re-checks the claim before trusting it.
export const verifyMfaRequestSchema = z.object({
  mfaChallengeToken: z.string().min(1),
  totpCode: z.string().regex(/^\d{6}$/, "totpCode must be a 6-digit code"),
});

export type VerifyMfaRequest = z.infer<typeof verifyMfaRequestSchema>;
