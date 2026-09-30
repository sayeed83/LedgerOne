import { z } from "zod";

// `companyUuid` is required, not optional — mirrors the Business layer's
// own `listCustomersByCompany` shape (a distinct use case from a
// tenant-wide list, not an optional filter on one), mirroring
// list-products-by-company-query.dto.ts's own identical convention
// (inventory module).
export const listCustomersByCompanyQuerySchema = z.object({
  companyUuid: z.string().uuid(),
});

export type ListCustomersByCompanyQuery = z.infer<typeof listCustomersByCompanyQuerySchema>;
