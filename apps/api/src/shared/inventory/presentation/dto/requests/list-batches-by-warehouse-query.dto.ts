import { z } from "zod";

// `warehouseUuid` is required, not optional — mirrors the Business layer's
// own `listBatchesByWarehouse` shape (a distinct use case from a tenant/
// company-wide list, not an optional filter on one), matching
// list-inventory-adjustments-by-warehouse-query.dto.ts's own
// `warehouseUuid`-required convention exactly.
export const listBatchesByWarehouseQuerySchema = z.object({
  warehouseUuid: z.string().uuid(),
});

export type ListBatchesByWarehouseQuery = z.infer<typeof listBatchesByWarehouseQuerySchema>;
