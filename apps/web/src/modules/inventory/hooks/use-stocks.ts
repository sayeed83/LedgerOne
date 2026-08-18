import { useQuery } from "@tanstack/react-query";
import type { StockResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function stocksQueryKey(warehouseUuid?: string) {
  return ["inventory", "stocks", warehouseUuid ?? "all"] as const;
}

export function useStocks(warehouseUuid: string | null) {
  return useQuery<StockResponseDto[], ApiError>({
    queryKey: stocksQueryKey(warehouseUuid ?? undefined),
    queryFn: () => inventoryService.listStocksByWarehouse(warehouseUuid as string),
    enabled: Boolean(warehouseUuid),
  });
}
