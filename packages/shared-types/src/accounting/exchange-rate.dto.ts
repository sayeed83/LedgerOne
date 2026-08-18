// Mirrors presentation/dto/responses/exchange-rate.response.dto.ts. Tenant-
// owned, immutable (create/get/list only — no PUT/DELETE). Flagged known
// backend gap: the response does not echo back `fromCurrencyUuid`/
// `toCurrencyUuid` — screens must keep the pair the user selected in local
// state/query params rather than reading it off the entity itself.
export interface ExchangeRateResponseDto {
  uuid: string;
  rate: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeRateRequestDto {
  fromCurrencyUuid: string;
  toCurrencyUuid: string;
  rate: string;
  effectiveDate: string;
}

export interface ListExchangeRatesQueryDto {
  fromCurrencyUuid?: string;
  toCurrencyUuid?: string;
}
