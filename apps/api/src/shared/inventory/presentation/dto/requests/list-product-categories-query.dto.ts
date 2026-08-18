import { z } from "zod";

// `companyUuid` is an optional query filter narrowing the tenant-wide list
// to one Company, mirroring Accounting's list-account-groups-query.dto.ts
// optional-filter shape.
export const listProductCategoriesQuerySchema = z.object({
  companyUuid: z.string().uuid().optional(),
});

export type ListProductCategoriesQuery = z.infer<typeof listProductCategoriesQuerySchema>;
