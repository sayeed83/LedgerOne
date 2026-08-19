import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateReorderLevelRequestDto, ReorderLevelResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { reorderLevelsByCompanyQueryKey, reorderLevelsByWarehouseQueryKey } from "./use-reorder-levels";

export function useCreateReorderLevel(companyUuid: string, warehouseUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<ReorderLevelResponseDto, ApiError, CreateReorderLevelRequestDto>({
    mutationFn: (payload) => inventoryService.createReorderLevel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reorderLevelsByCompanyQueryKey(companyUuid) });
      queryClient.invalidateQueries({ queryKey: reorderLevelsByWarehouseQueryKey(warehouseUuid) });
    },
  });
}
