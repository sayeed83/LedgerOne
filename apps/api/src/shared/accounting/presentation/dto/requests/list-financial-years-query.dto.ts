import { z } from "zod";

// `companyUuid` is an optional query filter narrowing the tenant-wide list
// to one Company, mirroring User Management's list-users-query.dto.ts
// optional-filter shape.
export const listFinancialYearsQuerySchema = z.object({
  companyUuid: z.string().uuid().optional(),
});

export type ListFinancialYearsQuery = z.infer<typeof listFinancialYearsQuerySchema>;
