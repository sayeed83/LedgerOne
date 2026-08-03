import { z } from "zod";

// Generic acknowledgement body — used by forgot-password (always identical
// regardless of whether the email exists, AUTHN-005/spec §9) and
// reset-password success.
export const messageResponseSchema = z.object({
  message: z.string(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;
