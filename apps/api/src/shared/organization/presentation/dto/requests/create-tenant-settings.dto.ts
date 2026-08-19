import { z } from "zod";

// 00_BUSINESS_RULES.md ORG-003/Ch.1.7: all three fields are required at
// creation (unlike `update-tenant-settings.dto.ts`, where every field is
// optional) — there is no documented default Currency/Time Zone/Financial
// Year pattern to fall back to, so the caller (the Organization
// Administrator, per Ch.1.7's onboarding workflow) must supply real values.
// Shape/format only — Zod does not validate against the Currency/TimeZone
// modules' own reference data (not built yet), mirroring
// update-tenant-settings.dto.ts's own documented scope.
export const createTenantSettingsRequestSchema = z.object({
  defaultCurrencyCode: z.string().length(3),
  defaultTimeZone: z.string().min(1),
  defaultFinancialYearPattern: z.string().min(1),
});

export type CreateTenantSettingsRequest = z.infer<typeof createTenantSettingsRequestSchema>;
