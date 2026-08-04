import { z } from "zod";

// PWD-003 (12–128 characters) enforced here as convenience only — the
// server re-validates identically and is the authoritative check (FP4).
export const resetPasswordFormSchema = z
  .object({
    tenantId: z.string().min(1, "Tenant ID is required.").regex(/^\d+$/, "Tenant ID must contain digits only."),
    token: z.string().min(1, "Reset token is required."),
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters.")
      .max(128, "Password must be no more than 128 characters."),
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
