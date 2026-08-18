import { z } from "zod";

// `branchUuid` is required, not optional — mirrors the Business layer's own
// `listWarehousesByBranch` shape (a distinct use case from a tenant-wide
// list, not an optional filter on one), matching
// list-products-by-company-query.dto.ts's own `companyUuid`-required
// convention.
export const listWarehousesByBranchQuerySchema = z.object({
  branchUuid: z.string().uuid(),
});

export type ListWarehousesByBranchQuery = z.infer<typeof listWarehousesByBranchQuerySchema>;
