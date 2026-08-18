import { z } from "zod";

// `companyUuid` is required, not optional — mirrors the Business layer's
// own `listUnitsByCompany` shape (a distinct use case from a tenant-wide
// list, not an optional filter on one).
export const listUnitsByCompanyQuerySchema = z.object({
  companyUuid: z.string().uuid(),
});

export type ListUnitsByCompanyQuery = z.infer<typeof listUnitsByCompanyQuerySchema>;
