import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateFinancialYearRequestDto,
  FinancialYearResponseDto,
  UpdateFinancialYearRequestDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

// TQ-002: hierarchical query keys, one factory per resource, reused by
// every consumer instead of hand-typed per call site.
export function financialYearsQueryKey(companyUuid?: string) {
  return ["accounting", "financial-years", companyUuid ?? "all"] as const;
}

export function financialYearQueryKey(financialYearUuid: string) {
  return ["accounting", "financial-year", financialYearUuid] as const;
}

// TBL-003: Financial Years are a small, bounded per-Company dataset —
// client-side pagination/search is the documented exception, mirroring
// Organization's own Company/Branch/Department lists.
export function useFinancialYears(companyUuid: string | null) {
  return useQuery<FinancialYearResponseDto[], ApiError>({
    queryKey: financialYearsQueryKey(companyUuid ?? undefined),
    queryFn: () => accountingService.listFinancialYears(companyUuid ?? undefined),
    enabled: Boolean(companyUuid),
  });
}

export function useFinancialYear(financialYearUuid: string | null) {
  return useQuery<FinancialYearResponseDto, ApiError>({
    queryKey: financialYearQueryKey(financialYearUuid ?? ""),
    queryFn: () => accountingService.getFinancialYear(financialYearUuid as string),
    enabled: Boolean(financialYearUuid),
  });
}

export function useCreateFinancialYear(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<FinancialYearResponseDto, ApiError, CreateFinancialYearRequestDto>({
    mutationFn: (payload) => accountingService.createFinancialYear(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financialYearsQueryKey(companyUuid) }),
  });
}

export function useUpdateFinancialYear(companyUuid: string, financialYearUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<FinancialYearResponseDto, ApiError, UpdateFinancialYearRequestDto>({
    mutationFn: (payload) => accountingService.updateFinancialYear(financialYearUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialYearQueryKey(financialYearUuid) });
      queryClient.invalidateQueries({ queryKey: financialYearsQueryKey(companyUuid) });
    },
  });
}

function useFinancialYearTransition(
  companyUuid: string,
  financialYearUuid: string,
  action: (uuid: string) => Promise<FinancialYearResponseDto>,
) {
  const queryClient = useQueryClient();
  return useMutation<FinancialYearResponseDto, ApiError, void>({
    mutationFn: () => action(financialYearUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialYearQueryKey(financialYearUuid) });
      queryClient.invalidateQueries({ queryKey: financialYearsQueryKey(companyUuid) });
    },
  });
}

export function useOpenFinancialYear(companyUuid: string, financialYearUuid: string) {
  return useFinancialYearTransition(companyUuid, financialYearUuid, accountingService.openFinancialYear);
}

export function useCloseFinancialYear(companyUuid: string, financialYearUuid: string) {
  return useFinancialYearTransition(companyUuid, financialYearUuid, accountingService.closeFinancialYear);
}

export function useReopenFinancialYear(companyUuid: string, financialYearUuid: string) {
  return useFinancialYearTransition(companyUuid, financialYearUuid, accountingService.reopenFinancialYear);
}
