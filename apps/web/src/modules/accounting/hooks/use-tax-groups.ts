import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTaxGroupRequestDto,
  TaxGroupResponseDto,
  UpdateTaxGroupRequestDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function taxGroupsQueryKey(companyUuid?: string) {
  return ["accounting", "tax-groups", companyUuid ?? "all"] as const;
}

export function taxGroupQueryKey(taxGroupUuid: string) {
  return ["accounting", "tax-group", taxGroupUuid] as const;
}

export function useTaxGroups(companyUuid: string | null) {
  return useQuery<TaxGroupResponseDto[], ApiError>({
    queryKey: taxGroupsQueryKey(companyUuid ?? undefined),
    queryFn: () => accountingService.listTaxGroups(companyUuid ?? undefined),
    enabled: Boolean(companyUuid),
  });
}

export function useTaxGroup(taxGroupUuid: string | null) {
  return useQuery<TaxGroupResponseDto, ApiError>({
    queryKey: taxGroupQueryKey(taxGroupUuid ?? ""),
    queryFn: () => accountingService.getTaxGroup(taxGroupUuid as string),
    enabled: Boolean(taxGroupUuid),
  });
}

export function useCreateTaxGroup(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TaxGroupResponseDto, ApiError, CreateTaxGroupRequestDto>({
    mutationFn: (payload) => accountingService.createTaxGroup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taxGroupsQueryKey(companyUuid) }),
  });
}

export function useUpdateTaxGroup(companyUuid: string, taxGroupUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TaxGroupResponseDto, ApiError, UpdateTaxGroupRequestDto>({
    mutationFn: (payload) => accountingService.updateTaxGroup(taxGroupUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxGroupQueryKey(taxGroupUuid) });
      queryClient.invalidateQueries({ queryKey: taxGroupsQueryKey(companyUuid) });
    },
  });
}
