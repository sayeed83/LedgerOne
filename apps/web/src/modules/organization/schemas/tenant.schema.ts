import { z } from "zod";

// VAL-001/VAL-004: convenience-only client validation (FP4) mirroring the
// backend's create-tenant.dto.ts/update-tenant.dto.ts wire shape.
export const tenantFormSchema = z.object({
  legalName: z.string().min(1, "Legal name is required."),
  primaryContactEmail: z.string().min(1, "Primary contact email is required.").email("Enter a valid email address."),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;
