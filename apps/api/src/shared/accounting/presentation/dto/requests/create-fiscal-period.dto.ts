import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Fiscal-Period-specific data). `financialYearUuid` identifies the parent
// Financial Year this Fiscal Period belongs to (00_BUSINESS_RULES.md Ch.6.1)
// — resolved to its internal `financialYearId` by the Business layer
// (`createFiscalPeriod`), which also derives `companyUuid` from that
// resolved parent, so it is not accepted here as a separate client input
// (mirroring create-financial-year.dto.ts's `companyUuid`, but one level
// deeper: this DTO's cross-reference is in-module, not cross-module).
// `startDate`/`endDate` arrive as ISO date strings over JSON and are coerced
// to `Date` (00_BUSINESS_RULES.md Ch.6.1).
export const createFiscalPeriodRequestSchema = z.object({
  financialYearUuid: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreateFiscalPeriodRequest = z.infer<typeof createFiscalPeriodRequestSchema>;
