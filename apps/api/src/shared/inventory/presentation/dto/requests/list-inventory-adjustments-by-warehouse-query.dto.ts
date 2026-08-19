import { z } from "zod";

// `warehouseUuid` is required, not optional — mirrors the Business layer's
// own `listInventoryAdjustmentsByWarehouse` shape (a distinct use case from
// a tenant/company-wide list, not an optional filter on one), matching
// list-warehouses-by-branch-query.dto.ts's own `branchUuid`-required
// convention.
export const listInventoryAdjustmentsByWarehouseQuerySchema = z.object({
  warehouseUuid: z.string().uuid(),
});

export type ListInventoryAdjustmentsByWarehouseQuery = z.infer<
  typeof listInventoryAdjustmentsByWarehouseQuerySchema
>;
