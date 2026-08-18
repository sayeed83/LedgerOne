import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateWarehouseRequestDto, WarehouseResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { warehouseQueryKey } from "./use-warehouse";
import { warehousesQueryKey } from "./use-warehouses";

export function useUpdateWarehouse(branchUuid: string, warehouseUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<WarehouseResponseDto, ApiError, UpdateWarehouseRequestDto>({
    mutationFn: (payload) => inventoryService.updateWarehouse(warehouseUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseQueryKey(warehouseUuid) });
      queryClient.invalidateQueries({ queryKey: warehousesQueryKey(branchUuid) });
    },
  });
}
