import { useQuery } from "@tanstack/react-query";
import type { BatchResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function batchesQueryKey(warehouseUuid?: string) {
  return ["inventory", "batches", warehouseUuid ?? "all"] as const;
}

export function useBatches(warehouseUuid: string | null) {
  return useQuery<BatchResponseDto[], ApiError>({
    queryKey: batchesQueryKey(warehouseUuid ?? undefined),
    queryFn: () => inventoryService.listBatchesByWarehouse(warehouseUuid as string),
    enabled: Boolean(warehouseUuid),
  });
}
