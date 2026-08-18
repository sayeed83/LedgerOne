import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCurrencyRequestDto,
  CurrencyResponseDto,
  CurrencyStatus,
  UpdateCurrencyRequestDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function currenciesQueryKey(status?: CurrencyStatus) {
  return ["accounting", "currencies", status ?? "all"] as const;
}

export function currencyQueryKey(currencyUuid: string) {
  return ["accounting", "currency", currencyUuid] as const;
}

export function useCurrencies(status?: CurrencyStatus) {
  return useQuery<CurrencyResponseDto[], ApiError>({
    queryKey: currenciesQueryKey(status),
    queryFn: () => accountingService.listCurrencies(status),
  });
}

export function useCurrency(currencyUuid: string | null) {
  return useQuery<CurrencyResponseDto, ApiError>({
    queryKey: currencyQueryKey(currencyUuid ?? ""),
    queryFn: () => accountingService.getCurrency(currencyUuid as string),
    enabled: Boolean(currencyUuid),
  });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();
  return useMutation<CurrencyResponseDto, ApiError, CreateCurrencyRequestDto>({
    mutationFn: (payload) => accountingService.createCurrency(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounting", "currencies"] }),
  });
}

export function useUpdateCurrency(currencyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<CurrencyResponseDto, ApiError, UpdateCurrencyRequestDto>({
    mutationFn: (payload) => accountingService.updateCurrency(currencyUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyQueryKey(currencyUuid) });
      queryClient.invalidateQueries({ queryKey: ["accounting", "currencies"] });
    },
  });
}

function useCurrencyTransition(currencyUuid: string, action: (uuid: string) => Promise<CurrencyResponseDto>) {
  const queryClient = useQueryClient();
  return useMutation<CurrencyResponseDto, ApiError, void>({
    mutationFn: () => action(currencyUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyQueryKey(currencyUuid) });
      queryClient.invalidateQueries({ queryKey: ["accounting", "currencies"] });
    },
  });
}

export function useActivateCurrency(currencyUuid: string) {
  return useCurrencyTransition(currencyUuid, accountingService.activateCurrency);
}

export function useDeactivateCurrency(currencyUuid: string) {
  return useCurrencyTransition(currencyUuid, accountingService.deactivateCurrency);
}
