import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateFiscalPeriodRequestDto,
  FiscalPeriodResponseDto,
  UpdateFiscalPeriodRequestDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function fiscalPeriodsQueryKey(financialYearUuid: string) {
  return ["accounting", "fiscal-periods", financialYearUuid] as const;
}

export function fiscalPeriodQueryKey(fiscalPeriodUuid: string) {
  return ["accounting", "fiscal-period", fiscalPeriodUuid] as const;
}

export function useFiscalPeriods(financialYearUuid: string | null) {
  return useQuery<FiscalPeriodResponseDto[], ApiError>({
    queryKey: fiscalPeriodsQueryKey(financialYearUuid ?? ""),
    queryFn: () => accountingService.listFiscalPeriods(financialYearUuid as string),
    enabled: Boolean(financialYearUuid),
  });
}

export function useFiscalPeriod(fiscalPeriodUuid: string | null) {
  return useQuery<FiscalPeriodResponseDto, ApiError>({
    queryKey: fiscalPeriodQueryKey(fiscalPeriodUuid ?? ""),
    queryFn: () => accountingService.getFiscalPeriod(fiscalPeriodUuid as string),
    enabled: Boolean(fiscalPeriodUuid),
  });
}

export function useCreateFiscalPeriod(financialYearUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<FiscalPeriodResponseDto, ApiError, CreateFiscalPeriodRequestDto>({
    mutationFn: (payload) => accountingService.createFiscalPeriod(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fiscalPeriodsQueryKey(financialYearUuid) }),
  });
}

export function useUpdateFiscalPeriod(financialYearUuid: string, fiscalPeriodUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<FiscalPeriodResponseDto, ApiError, UpdateFiscalPeriodRequestDto>({
    mutationFn: (payload) => accountingService.updateFiscalPeriod(fiscalPeriodUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fiscalPeriodQueryKey(fiscalPeriodUuid) });
      queryClient.invalidateQueries({ queryKey: fiscalPeriodsQueryKey(financialYearUuid) });
    },
  });
}

function useFiscalPeriodTransition(
  financialYearUuid: string,
  fiscalPeriodUuid: string,
  action: (uuid: string) => Promise<FiscalPeriodResponseDto>,
) {
  const queryClient = useQueryClient();
  return useMutation<FiscalPeriodResponseDto, ApiError, void>({
    mutationFn: () => action(fiscalPeriodUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fiscalPeriodQueryKey(fiscalPeriodUuid) });
      queryClient.invalidateQueries({ queryKey: fiscalPeriodsQueryKey(financialYearUuid) });
    },
  });
}

export function useSoftCloseFiscalPeriod(financialYearUuid: string, fiscalPeriodUuid: string) {
  return useFiscalPeriodTransition(financialYearUuid, fiscalPeriodUuid, accountingService.softCloseFiscalPeriod);
}

export function useCloseFiscalPeriod(financialYearUuid: string, fiscalPeriodUuid: string) {
  return useFiscalPeriodTransition(financialYearUuid, fiscalPeriodUuid, accountingService.closeFiscalPeriod);
}

export function useReopenFiscalPeriod(financialYearUuid: string, fiscalPeriodUuid: string) {
  return useFiscalPeriodTransition(financialYearUuid, fiscalPeriodUuid, accountingService.reopenFiscalPeriod);
}
