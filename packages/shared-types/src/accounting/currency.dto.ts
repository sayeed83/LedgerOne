// Mirrors apps/api/src/shared/accounting/domain/enums/currency-status.enum.ts.
export enum CurrencyStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}

// Platform-owned reference data (MT-005) — no `companyUuid`/tenant scoping,
// mirrors presentation/dto/responses/currency.response.dto.ts.
export interface CurrencyResponseDto {
  uuid: string;
  isoCode: string;
  name: string;
  symbol: string;
  decimalPrecision: number;
  status: CurrencyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencyRequestDto {
  isoCode: string;
  name: string;
  symbol: string;
  decimalPrecision: number;
}

export interface UpdateCurrencyRequestDto {
  name?: string;
  symbol?: string;
  decimalPrecision?: number;
}
