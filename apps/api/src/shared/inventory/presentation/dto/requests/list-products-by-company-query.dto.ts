import { z } from "zod";

// `companyUuid` is required, not optional — mirrors the Business layer's
// own `listProductsByCompany` shape (a distinct use case from a tenant-wide
// list, not an optional filter on one).
export const listProductsByCompanyQuerySchema = z.object({
  companyUuid: z.string().uuid(),
});

export type ListProductsByCompanyQuery = z.infer<typeof listProductsByCompanyQuerySchema>;
