import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateInventoryAdjustmentRequestDto, InventoryAdjustmentResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { inventoryAdjustmentsQueryKey } from "./use-inventory-adjustments";

export function useCreateInventoryAdjustment(warehouseUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<InventoryAdjustmentResponseDto, ApiError, CreateInventoryAdjustmentRequestDto>({
    mutationFn: (payload) => inventoryService.createInventoryAdjustment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryAdjustmentsQueryKey(warehouseUuid) });
    },
  });
}
