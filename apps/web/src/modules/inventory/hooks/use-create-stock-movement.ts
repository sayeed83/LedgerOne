import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateStockMovementRequestDto, StockMovementResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { stockMovementsQueryKey } from "./use-stock-movements";

export function useCreateStockMovement(warehouseUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<StockMovementResponseDto, ApiError, CreateStockMovementRequestDto>({
    mutationFn: (payload) => inventoryService.createStockMovement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockMovementsQueryKey(warehouseUuid) });
    },
  });
}
