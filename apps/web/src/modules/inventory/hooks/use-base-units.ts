import { useQuery } from "@tanstack/react-query";
import type { UnitResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function baseUnitsQueryKey(companyUuid?: string) {
  return ["inventory", "base-units", companyUuid ?? "all"] as const;
}

export function useBaseUnits(companyUuid: string | null) {
  return useQuery<UnitResponseDto[], ApiError>({
    queryKey: baseUnitsQueryKey(companyUuid ?? undefined),
    queryFn: () => inventoryService.listBaseUnits(companyUuid as string),
    enabled: Boolean(companyUuid),
  });
}
