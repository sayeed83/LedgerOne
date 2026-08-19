import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BatchResponseDto, CreateBatchRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { batchesQueryKey } from "./use-batches";

export function useCreateBatch(warehouseUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<BatchResponseDto, ApiError, CreateBatchRequestDto>({
    mutationFn: (payload) => inventoryService.createBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchesQueryKey(warehouseUuid) });
    },
  });
}
