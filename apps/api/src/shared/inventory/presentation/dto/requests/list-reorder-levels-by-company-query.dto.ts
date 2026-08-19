import { z } from "zod";

// `companyUuid` is required, not optional — mirrors the Business layer's own
// `listReorderLevelsByCompany` shape (a distinct use case from a Warehouse-
// scoped list, not an optional filter on one), matching
// list-products-by-company-query.dto.ts's/list-units-by-company-query.dto.ts's
// own `companyUuid`-required convention exactly.
export const listReorderLevelsByCompanyQuerySchema = z.object({
  companyUuid: z.string().uuid(),
});

export type ListReorderLevelsByCompanyQuery = z.infer<typeof listReorderLevelsByCompanyQuerySchema>;
