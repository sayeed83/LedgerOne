import { z } from "zod";

// `companyUuid` is an optional query filter narrowing the tenant-wide list
// to one Company, mirroring list-tax-groups-query.dto.ts's optional-filter
// shape.
export const listAccountGroupsQuerySchema = z.object({
  companyUuid: z.string().uuid().optional(),
});

export type ListAccountGroupsQuery = z.infer<typeof listAccountGroupsQuerySchema>;
