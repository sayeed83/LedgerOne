import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTaxRuleRequestDto, TaxRuleResponseDto } from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function taxRulesQueryKey(taxGroupUuid: string) {
  return ["accounting", "tax-rules", taxGroupUuid] as const;
}

// Tax Rules are immutable — create/get/list only, no update/lifecycle hook.
export function useTaxRules(taxGroupUuid: string | null) {
  return useQuery<TaxRuleResponseDto[], ApiError>({
    queryKey: taxRulesQueryKey(taxGroupUuid ?? ""),
    queryFn: () => accountingService.listTaxRules(taxGroupUuid as string),
    enabled: Boolean(taxGroupUuid),
  });
}

export function useCreateTaxRule(taxGroupUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TaxRuleResponseDto, ApiError, CreateTaxRuleRequestDto>({
    mutationFn: (payload) => accountingService.createTaxRule(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taxRulesQueryKey(taxGroupUuid) }),
  });
}
