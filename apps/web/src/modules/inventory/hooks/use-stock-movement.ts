import { useQuery } from "@tanstack/react-query";
import type { StockMovementResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function stockMovementQueryKey(movementUuid: string) {
  return ["inventory", "stock-movement", movementUuid] as const;
}

export function useStockMovement(movementUuid: string | null) {
  return useQuery<StockMovementResponseDto, ApiError>({
    queryKey: stockMovementQueryKey(movementUuid ?? ""),
    queryFn: () => inventoryService.getStockMovement(movementUuid as string),
    enabled: Boolean(movementUuid),
  });
}
