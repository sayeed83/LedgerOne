import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateUnitRequestDto, UnitResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { unitsQueryKey } from "./use-units";
import { baseUnitsQueryKey } from "./use-base-units";

export function useCreateUnit(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<UnitResponseDto, ApiError, CreateUnitRequestDto>({
    mutationFn: (payload) => inventoryService.createUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitsQueryKey(companyUuid) });
      queryClient.invalidateQueries({ queryKey: baseUnitsQueryKey(companyUuid) });
    },
  });
}
