import { z } from "zod";

// VAL-001/VAL-004: convenience-only client validation (FP4) mirroring the
// backend's login.dto.ts wire shape, with human-readable messages instead
// of raw Zod defaults.
export const loginFormSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required.").regex(/^\d+$/, "Tenant ID must contain digits only."),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
