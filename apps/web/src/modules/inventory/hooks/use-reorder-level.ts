import { useQuery } from "@tanstack/react-query";
import type { ReorderLevelResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function reorderLevelQueryKey(reorderLevelUuid: string) {
  return ["inventory", "reorder-level", reorderLevelUuid] as const;
}

export function useReorderLevel(reorderLevelUuid: string | null) {
  return useQuery<ReorderLevelResponseDto, ApiError>({
    queryKey: reorderLevelQueryKey(reorderLevelUuid ?? ""),
    queryFn: () => inventoryService.getReorderLevel(reorderLevelUuid as string),
    enabled: Boolean(reorderLevelUuid),
  });
}
