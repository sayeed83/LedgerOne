// Business layer — defines a new Currency (00_BUSINESS_RULES.md Ch.7.1).
// Platform-owned reference data (Ch.7.5) — no `tenantId`, unlike every other
// use case in this module. The ISO code must not already belong to another
// (non-deleted) Currency — checked here rather than left unenforced, since
// the Repository layer performs no duplicate checking of its own
// (Repository milestone's own scope: persistence only).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Currency } from "../domain/aggregates/currency.aggregate";
import { DuplicateCurrencyIsoCodeError } from "../domain/errors/accounting.errors";

export interface CreateCurrencyInput {
  isoCode: string;
  name: string;
  symbol: string;
  decimalPrecision: number;
}

export interface CreateCurrencyDeps {
  repository: IAccountingRepository;
}

export async function createCurrency(input: CreateCurrencyInput, deps: CreateCurrencyDeps): Promise<Currency> {
  const { repository } = deps;

  const existing = await repository.findCurrencyByIsoCode(input.isoCode);
  if (existing) {
    throw new DuplicateCurrencyIsoCodeError(input.isoCode);
  }

  return repository.createCurrency({
    isoCode: input.isoCode,
    name: input.name,
    symbol: input.symbol,
    decimalPrecision: input.decimalPrecision,
  });
}
