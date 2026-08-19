import { z } from "zod";

// `warehouseUuid` is required, not optional — mirrors the Business layer's
// own `listReorderLevelsByWarehouse` shape (a distinct use case from a
// Company-wide list, not an optional filter on one), matching
// list-batches-by-warehouse-query.dto.ts's/
// list-inventory-adjustments-by-warehouse-query.dto.ts's own
// `warehouseUuid`-required convention exactly.
export const listReorderLevelsByWarehouseQuerySchema = z.object({
  warehouseUuid: z.string().uuid(),
});

export type ListReorderLevelsByWarehouseQuery = z.infer<typeof listReorderLevelsByWarehouseQuerySchema>;
