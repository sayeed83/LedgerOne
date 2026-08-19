import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BatchResponseDto, UpdateBatchRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { batchQueryKey } from "./use-batch";
import { batchesQueryKey } from "./use-batches";

export function useUpdateBatch(warehouseUuid: string, batchUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<BatchResponseDto, ApiError, UpdateBatchRequestDto>({
    mutationFn: (payload) => inventoryService.updateBatch(batchUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchQueryKey(batchUuid) });
      queryClient.invalidateQueries({ queryKey: batchesQueryKey(warehouseUuid) });
    },
  });
}
