// Business layer — reads an Exchange Rate by its external identifier,
// scoped to the supplied Tenant (00_BUSINESS_RULES.md Ch.31.1). Never
// resolves by the internal `id` (06_DATABASE_STANDARDS.md PK-003) —
// callers outside this module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { ExchangeRate } from "../domain/entities/exchange-rate.entity";
import { ExchangeRateNotFoundError } from "../domain/errors/accounting.errors";

export interface GetExchangeRateInput {
  tenantId: bigint;
  exchangeRateUuid: string;
}

export interface GetExchangeRateDeps {
  repository: IAccountingRepository;
}

export async function getExchangeRate(input: GetExchangeRateInput, deps: GetExchangeRateDeps): Promise<ExchangeRate> {
  const exchangeRate = await deps.repository.findExchangeRateByUuid(input.tenantId, input.exchangeRateUuid);
  if (!exchangeRate) {
    throw new ExchangeRateNotFoundError(input.exchangeRateUuid);
  }
  return exchangeRate;
}
