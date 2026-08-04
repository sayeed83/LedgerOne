import { z } from "zod";

// `companyUuid` is an optional query filter narrowing the tenant-wide list
// to one Company, mirroring list-financial-years-query.dto.ts's optional-
// filter shape.
export const listTaxGroupsQuerySchema = z.object({
  companyUuid: z.string().uuid().optional(),
});

export type ListTaxGroupsQuery = z.infer<typeof listTaxGroupsQuerySchema>;
