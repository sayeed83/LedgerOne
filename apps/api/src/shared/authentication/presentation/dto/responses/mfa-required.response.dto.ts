import { z } from "zod";

export const mfaRequiredResponseSchema = z.object({
  mfaChallengeToken: z.string(),
});

export type MfaRequiredResponse = z.infer<typeof mfaRequiredResponseSchema>;
