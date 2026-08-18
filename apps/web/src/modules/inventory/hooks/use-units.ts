import { useQuery } from "@tanstack/react-query";
import type { UnitResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function unitsQueryKey(companyUuid?: string) {
  return ["inventory", "units", companyUuid ?? "all"] as const;
}

export function useUnits(companyUuid: string | null) {
  return useQuery<UnitResponseDto[], ApiError>({
    queryKey: unitsQueryKey(companyUuid ?? undefined),
    queryFn: () => inventoryService.listUnitsByCompany(companyUuid as string),
    enabled: Boolean(companyUuid),
  });
}
