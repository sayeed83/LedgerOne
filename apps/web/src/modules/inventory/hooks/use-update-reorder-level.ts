import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReorderLevelResponseDto, UpdateReorderLevelRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { reorderLevelQueryKey } from "./use-reorder-level";
import { reorderLevelsByCompanyQueryKey, reorderLevelsByWarehouseQueryKey } from "./use-reorder-levels";

export function useUpdateReorderLevel(companyUuid: string, warehouseUuid: string, reorderLevelUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<ReorderLevelResponseDto, ApiError, UpdateReorderLevelRequestDto>({
    mutationFn: (payload) => inventoryService.updateReorderLevel(reorderLevelUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reorderLevelQueryKey(reorderLevelUuid) });
      queryClient.invalidateQueries({ queryKey: reorderLevelsByCompanyQueryKey(companyUuid) });
      queryClient.invalidateQueries({ queryKey: reorderLevelsByWarehouseQueryKey(warehouseUuid) });
    },
  });
}
