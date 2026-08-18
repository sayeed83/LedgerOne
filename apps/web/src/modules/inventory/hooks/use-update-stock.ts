import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StockResponseDto, UpdateStockRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { stockQueryKey } from "./use-stock";
import { stocksQueryKey } from "./use-stocks";

export function useUpdateStock(warehouseUuid: string, stockUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<StockResponseDto, ApiError, UpdateStockRequestDto>({
    mutationFn: (payload) => inventoryService.updateStock(stockUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockQueryKey(stockUuid) });
      queryClient.invalidateQueries({ queryKey: stocksQueryKey(warehouseUuid) });
    },
  });
}
