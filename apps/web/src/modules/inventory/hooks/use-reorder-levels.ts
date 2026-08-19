import { useQuery } from "@tanstack/react-query";
import type { ReorderLevelResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

// Reorder Level exposes two distinct, equally-authorized list endpoints
// (`GET /reorder-levels?companyUuid=` and
// `GET /reorder-levels/by-warehouse?warehouseUuid=` — see the backend's own
// list-reorder-levels-by-company.controller.ts's/
// list-reorder-levels-by-warehouse.controller.ts's header comments), so both
// hooks live in this one file rather than splitting into
// `use-reorder-levels-by-company.ts`/`use-reorder-levels-by-warehouse.ts`.

export function reorderLevelsByCompanyQueryKey(companyUuid?: string) {
  return ["inventory", "reorder-levels", "by-company", companyUuid ?? "none"] as const;
}

export function useReorderLevelsByCompany(companyUuid: string | null) {
  return useQuery<ReorderLevelResponseDto[], ApiError>({
    queryKey: reorderLevelsByCompanyQueryKey(companyUuid ?? undefined),
    queryFn: () => inventoryService.listReorderLevelsByCompany(companyUuid as string),
    enabled: Boolean(companyUuid),
  });
}

export function reorderLevelsByWarehouseQueryKey(warehouseUuid?: string) {
  return ["inventory", "reorder-levels", "by-warehouse", warehouseUuid ?? "none"] as const;
}

export function useReorderLevelsByWarehouse(warehouseUuid: string | null) {
  return useQuery<ReorderLevelResponseDto[], ApiError>({
    queryKey: reorderLevelsByWarehouseQueryKey(warehouseUuid ?? undefined),
    queryFn: () => inventoryService.listReorderLevelsByWarehouse(warehouseUuid as string),
    enabled: Boolean(warehouseUuid),
  });
}
