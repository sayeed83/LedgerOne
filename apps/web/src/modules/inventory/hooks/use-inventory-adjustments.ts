import { useQuery } from "@tanstack/react-query";
import type { InventoryAdjustmentResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function inventoryAdjustmentsQueryKey(warehouseUuid?: string) {
  return ["inventory", "inventory-adjustments", warehouseUuid ?? "all"] as const;
}

export function useInventoryAdjustments(warehouseUuid: string | null) {
  return useQuery<InventoryAdjustmentResponseDto[], ApiError>({
    queryKey: inventoryAdjustmentsQueryKey(warehouseUuid ?? undefined),
    queryFn: () => inventoryService.listInventoryAdjustmentsByWarehouse(warehouseUuid as string),
    enabled: Boolean(warehouseUuid),
  });
}
