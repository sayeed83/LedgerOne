import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateStockRequestDto, StockResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { stocksQueryKey } from "./use-stocks";

export function useCreateStock(warehouseUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<StockResponseDto, ApiError, CreateStockRequestDto>({
    mutationFn: (payload) => inventoryService.createStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stocksQueryKey(warehouseUuid) });
    },
  });
}
