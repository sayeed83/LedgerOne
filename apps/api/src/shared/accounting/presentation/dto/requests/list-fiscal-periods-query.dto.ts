import { z } from "zod";

// `financialYearUuid` is an optional query filter narrowing the tenant-wide
// list to one Financial Year, mirroring list-financial-years-query.dto.ts's
// optional `companyUuid` filter.
export const listFiscalPeriodsQuerySchema = z.object({
  financialYearUuid: z.string().uuid().optional(),
});

export type ListFiscalPeriodsQuery = z.infer<typeof listFiscalPeriodsQuerySchema>;
