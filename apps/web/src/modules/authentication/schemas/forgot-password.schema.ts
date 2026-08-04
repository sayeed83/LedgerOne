import { z } from "zod";

export const forgotPasswordFormSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required.").regex(/^\d+$/, "Tenant ID must contain digits only."),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
