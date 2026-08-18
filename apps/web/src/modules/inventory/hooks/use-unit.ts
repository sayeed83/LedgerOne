import { useQuery } from "@tanstack/react-query";
import type { UnitResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";

export function unitQueryKey(unitUuid: string) {
  return ["inventory", "unit", unitUuid] as const;
}

export function useUnit(unitUuid: string | null) {
  return useQuery<UnitResponseDto, ApiError>({
    queryKey: unitQueryKey(unitUuid ?? ""),
    queryFn: () => inventoryService.getUnit(unitUuid as string),
    enabled: Boolean(unitUuid),
  });
}
