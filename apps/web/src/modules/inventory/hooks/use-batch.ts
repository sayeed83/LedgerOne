import { useQuery } from "@tanstack/react-query";
import type { BatchResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function batchQueryKey(batchUuid: string) {
  return ["inventory", "batch", batchUuid] as const;
}

export function useBatch(batchUuid: string | null) {
  return useQuery<BatchResponseDto, ApiError>({
    queryKey: batchQueryKey(batchUuid ?? ""),
    queryFn: () => inventoryService.getBatch(batchUuid as string),
    enabled: Boolean(batchUuid),
  });
}
