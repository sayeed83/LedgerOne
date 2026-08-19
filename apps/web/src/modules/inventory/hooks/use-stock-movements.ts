import { useQuery } from "@tanstack/react-query";
import type { StockMovementResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

// Matches either `sourceWarehouseUuid` or `destinationWarehouseUuid`
// (00_BUSINESS_RULES.md Ch.39.10) — mirrors `useInventoryAdjustments`'s own
// Warehouse-scoped shape exactly.
export function stockMovementsQueryKey(warehouseUuid?: string) {
  return ["inventory", "stock-movements", warehouseUuid ?? "all"] as const;
}

export function useStockMovements(warehouseUuid: string | null) {
  return useQuery<StockMovementResponseDto[], ApiError>({
    queryKey: stockMovementsQueryKey(warehouseUuid ?? undefined),
    queryFn: () => inventoryService.listStockMovementsByWarehouse(warehouseUuid as string),
    enabled: Boolean(warehouseUuid),
  });
}
