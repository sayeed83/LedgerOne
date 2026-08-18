import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateWarehouseRequestDto, WarehouseResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { warehousesQueryKey } from "./use-warehouses";

export function useCreateWarehouse(branchUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<WarehouseResponseDto, ApiError, CreateWarehouseRequestDto>({
    mutationFn: (payload) => inventoryService.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehousesQueryKey(branchUuid) });
    },
  });
}
