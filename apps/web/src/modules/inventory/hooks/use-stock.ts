import { useQuery } from "@tanstack/react-query";
import type { StockResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function stockQueryKey(stockUuid: string) {
  return ["inventory", "stock", stockUuid] as const;
}

export function useStock(stockUuid: string | null) {
  return useQuery<StockResponseDto, ApiError>({
    queryKey: stockQueryKey(stockUuid ?? ""),
    queryFn: () => inventoryService.getStock(stockUuid as string),
    enabled: Boolean(stockUuid),
  });
}
