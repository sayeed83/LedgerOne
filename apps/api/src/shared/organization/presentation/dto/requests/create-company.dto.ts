import { z } from "zod";

// `tenantUuid` arrives via the `X-Tenant-Id` header (tenant-id-header.schema.ts),
// not the body — it is tenant context, not company-specific data.
export const createCompanyRequestSchema = z.object({
  companyCode: z.string().min(1),
  legalName: z.string().min(1),
  displayName: z.string().min(1).nullable().optional(),
  legalEntityType: z.string().min(1).nullable().optional(),
  taxRegistrationNumber: z.string().min(1),
  baseCurrencyCode: z.string().length(3),
  country: z.string().min(1),
  timeZone: z.string().min(1),
  financialYearStartMonth: z.number().int().min(1).max(12),
  financialYearStartDay: z.number().int().min(1).max(31),
});

export type CreateCompanyRequest = z.infer<typeof createCompanyRequestSchema>;
