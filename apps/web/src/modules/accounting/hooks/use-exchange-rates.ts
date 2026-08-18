import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateExchangeRateRequestDto,
  ExchangeRateResponseDto,
  ListExchangeRatesQueryDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function exchangeRatesQueryKey(query?: ListExchangeRatesQueryDto) {
  return ["accounting", "exchange-rates", query ?? {}] as const;
}

export function exchangeRateQueryKey(exchangeRateUuid: string) {
  return ["accounting", "exchange-rate", exchangeRateUuid] as const;
}

// Exchange Rates are tenant-owned and immutable — this hook has no
// update/lifecycle counterpart, mirroring the backend's create/get/list-only
// surface.
export function useExchangeRates(query?: ListExchangeRatesQueryDto) {
  return useQuery<ExchangeRateResponseDto[], ApiError>({
    queryKey: exchangeRatesQueryKey(query),
    queryFn: () => accountingService.listExchangeRates(query),
  });
}

export function useExchangeRate(exchangeRateUuid: string | null) {
  return useQuery<ExchangeRateResponseDto, ApiError>({
    queryKey: exchangeRateQueryKey(exchangeRateUuid ?? ""),
    queryFn: () => accountingService.getExchangeRate(exchangeRateUuid as string),
    enabled: Boolean(exchangeRateUuid),
  });
}

export function useCreateExchangeRate() {
  const queryClient = useQueryClient();
  return useMutation<ExchangeRateResponseDto, ApiError, CreateExchangeRateRequestDto>({
    mutationFn: (payload) => accountingService.createExchangeRate(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounting", "exchange-rates"] }),
  });
}
