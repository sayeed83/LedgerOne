import { useQuery } from "@tanstack/react-query";
import type { InventoryAdjustmentResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function inventoryAdjustmentQueryKey(adjustmentUuid: string) {
  return ["inventory", "inventory-adjustment", adjustmentUuid] as const;
}

export function useInventoryAdjustment(adjustmentUuid: string | null) {
  return useQuery<InventoryAdjustmentResponseDto, ApiError>({
    queryKey: inventoryAdjustmentQueryKey(adjustmentUuid ?? ""),
    queryFn: () => inventoryService.getInventoryAdjustment(adjustmentUuid as string),
    enabled: Boolean(adjustmentUuid),
  });
}
