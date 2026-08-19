import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryAdjustmentResponseDto, UpdateInventoryAdjustmentRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { inventoryAdjustmentQueryKey } from "./use-inventory-adjustment";
import { inventoryAdjustmentsQueryKey } from "./use-inventory-adjustments";

export function useUpdateInventoryAdjustment(warehouseUuid: string, adjustmentUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<InventoryAdjustmentResponseDto, ApiError, UpdateInventoryAdjustmentRequestDto>({
    mutationFn: (payload) => inventoryService.updateInventoryAdjustment(adjustmentUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryAdjustmentQueryKey(adjustmentUuid) });
      queryClient.invalidateQueries({ queryKey: inventoryAdjustmentsQueryKey(warehouseUuid) });
    },
  });
}
