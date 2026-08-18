import { useQuery } from "@tanstack/react-query";
import type { WarehouseResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function warehouseQueryKey(warehouseUuid: string) {
  return ["inventory", "warehouse", warehouseUuid] as const;
}

export function useWarehouse(warehouseUuid: string | null) {
  return useQuery<WarehouseResponseDto, ApiError>({
    queryKey: warehouseQueryKey(warehouseUuid ?? ""),
    queryFn: () => inventoryService.getWarehouse(warehouseUuid as string),
    enabled: Boolean(warehouseUuid),
  });
}
