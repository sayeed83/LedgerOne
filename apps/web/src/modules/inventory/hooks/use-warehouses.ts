import { useQuery } from "@tanstack/react-query";
import type { WarehouseResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function warehousesQueryKey(branchUuid?: string) {
  return ["inventory", "warehouses", branchUuid ?? "all"] as const;
}

export function useWarehouses(branchUuid: string | null) {
  return useQuery<WarehouseResponseDto[], ApiError>({
    queryKey: warehousesQueryKey(branchUuid ?? undefined),
    queryFn: () => inventoryService.listWarehousesByBranch(branchUuid as string),
    enabled: Boolean(branchUuid),
  });
}
