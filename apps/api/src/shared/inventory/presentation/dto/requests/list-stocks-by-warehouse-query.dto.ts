import { z } from "zod";

// `warehouseUuid` is required, not optional — mirrors the Business layer's
// own `listStocksByWarehouse` shape (a distinct use case from a
// tenant/company-wide list, not an optional filter on one), matching
// list-warehouses-by-branch-query.dto.ts's own `branchUuid`-required
// convention.
export const listStocksByWarehouseQuerySchema = z.object({
  warehouseUuid: z.string().uuid(),
});

export type ListStocksByWarehouseQuery = z.infer<typeof listStocksByWarehouseQuerySchema>;
