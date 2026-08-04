import { z } from "zod";

// 00_BUSINESS_RULES.md ORG-003: Currency/TimeZone/FinancialYearPattern
// defaults. Shape/format only — Zod does not validate against the
// Currency/TimeZone/Company modules' own reference data (not built yet).
export const updateTenantSettingsRequestSchema = z.object({
  defaultCurrencyCode: z.string().length(3).optional(),
  defaultTimeZone: z.string().min(1).optional(),
  defaultFinancialYearPattern: z.string().min(1).optional(),
});

export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsRequestSchema>;
