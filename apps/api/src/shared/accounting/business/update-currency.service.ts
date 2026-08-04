// Business layer — revises a Currency's descriptive fields
// (00_BUSINESS_RULES.md Ch.7.3: name, symbol, decimal-precision convention).
// `isoCode` is never revised here — Currency "owns" its ISO code (Ch.7.3) as
// its stable identity, mirroring how Financial Year's `companyUuid`/Fiscal
// Period's `financialYearId` are likewise never revised by their own
// update-*.service.ts. Status is never changed here (see
// activate/deactivate-currency.service.ts).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Currency } from "../domain/aggregates/currency.aggregate";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";

export interface UpdateCurrencyInput {
  currencyUuid: string;
  name?: string;
  symbol?: string;
  decimalPrecision?: number;
}

export interface UpdateCurrencyDeps {
  repository: IAccountingRepository;
}

export async function updateCurrency(input: UpdateCurrencyInput, deps: UpdateCurrencyDeps): Promise<Currency> {
  const { repository } = deps;

  const currency = await repository.findCurrencyByUuid(input.currencyUuid);
  if (!currency) {
    throw new CurrencyNotFoundError(input.currencyUuid);
  }

  return repository.updateCurrency(currency.uuid, {
    name: input.name,
    symbol: input.symbol,
    decimalPrecision: input.decimalPrecision,
  });
}
