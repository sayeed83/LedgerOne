import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Financial-Year-specific data). `companyUuid` is a cross-module reference
// (FK-002) to Organization's `companies.uuid` — accepted as client input
// (the caller identifies which Company the Financial Year belongs to) but
// never validated for existence here, mirroring User Management's own
// `companyUuid` handling on create-user.dto.ts. `startDate`/`endDate` arrive
// as ISO date strings over JSON and are coerced to `Date` (00_BUSINESS_RULES.md
// Ch.5.1).
export const createFinancialYearRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreateFinancialYearRequest = z.infer<typeof createFinancialYearRequestSchema>;
