// Business layer — lists Exchange Rates within a Tenant, optionally
// narrowed to a single currency pair (00_BUSINESS_RULES.md Ch.31.1). Accepts
// external `uuid`s for the optional filter (never the internal
// `fromCurrencyId`/`toCurrencyId`, 06_DATABASE_STANDARDS.md PK-003),
// resolving each to its internal id before delegating to the Repository,
// mirroring create-exchange-rate.service.ts's own resolution.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { ExchangeRate } from "../domain/entities/exchange-rate.entity";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";

export interface ListExchangeRatesInput {
  tenantId: bigint;
  fromCurrencyUuid?: string;
  toCurrencyUuid?: string;
}

export interface ListExchangeRatesDeps {
  repository: IAccountingRepository;
}

export async function listExchangeRates(input: ListExchangeRatesInput, deps: ListExchangeRatesDeps): Promise<ExchangeRate[]> {
  const { repository } = deps;

  let fromCurrencyId: bigint | undefined;
  if (input.fromCurrencyUuid) {
    const fromCurrency = await repository.findCurrencyByUuid(input.fromCurrencyUuid);
    if (!fromCurrency) {
      throw new CurrencyNotFoundError(input.fromCurrencyUuid);
    }
    fromCurrencyId = fromCurrency.id;
  }

  let toCurrencyId: bigint | undefined;
  if (input.toCurrencyUuid) {
    const toCurrency = await repository.findCurrencyByUuid(input.toCurrencyUuid);
    if (!toCurrency) {
      throw new CurrencyNotFoundError(input.toCurrencyUuid);
    }
    toCurrencyId = toCurrency.id;
  }

  return repository.listExchangeRates(input.tenantId, fromCurrencyId, toCurrencyId);
}
