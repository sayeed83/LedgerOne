import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UnitResponseDto, UpdateUnitRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { unitQueryKey } from "./use-unit";
import { unitsQueryKey } from "./use-units";
import { baseUnitsQueryKey } from "./use-base-units";

export function useUpdateUnit(companyUuid: string, unitUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<UnitResponseDto, ApiError, UpdateUnitRequestDto>({
    mutationFn: (payload) => inventoryService.updateUnit(unitUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitQueryKey(unitUuid) });
      queryClient.invalidateQueries({ queryKey: unitsQueryKey(companyUuid) });
      queryClient.invalidateQueries({ queryKey: baseUnitsQueryKey(companyUuid) });
    },
  });
}
