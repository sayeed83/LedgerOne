import { z } from "zod";

// Mirrors the backend's create/update-tenant-settings.dto.ts field
// shapes exactly (00_BUSINESS_RULES.md Ch.1.7/ORG-003) — no invented
// validation rules. All three fields are required in this form regardless
// of create-vs-edit (the backend's own `update-*` schema makes each field
// individually optional only to support a partial PATCH-style revision; a
// human filling out this form always wants all three set).
export const tenantSettingsFormSchema = z.object({
  defaultCurrencyCode: z
    .string()
    .length(3, "Enter a 3-letter ISO currency code (e.g. USD).")
    .transform((value) => value.toUpperCase()),
  defaultTimeZone: z.string().min(1, "Default time zone is required."),
  defaultFinancialYearPattern: z.string().min(1, "Default financial year pattern is required."),
});

export type TenantSettingsFormValues = z.infer<typeof tenantSettingsFormSchema>;
