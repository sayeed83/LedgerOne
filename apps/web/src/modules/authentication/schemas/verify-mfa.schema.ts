import { z } from "zod";

export const verifyMfaFormSchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
});

export type VerifyMfaFormValues = z.infer<typeof verifyMfaFormSchema>;
