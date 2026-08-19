import { z } from "zod";

// `warehouseUuid` is required, not optional — mirrors the Business layer's
// own `listStockMovementsByWarehouse` shape (a distinct use case from a
// tenant/company-wide list, not an optional filter on one), matching
// list-inventory-adjustments-by-warehouse-query.dto.ts's own
// `warehouseUuid`-required convention. Matches either
// `sourceWarehouseUuid` or `destinationWarehouseUuid` (Ch.39.10 — a
// Transfer populates both on one row, STM-003).
export const listStockMovementsByWarehouseQuerySchema = z.object({
  warehouseUuid: z.string().uuid(),
});

export type ListStockMovementsByWarehouseQuery = z.infer<typeof listStockMovementsByWarehouseQuerySchema>;
