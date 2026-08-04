// Business layer — transitions a Currency to Inactive
// (00_BUSINESS_RULES.md Ch.7.5/7.8): valid only from Active. The Domain
// aggregate's `deactivate()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it. An
// Inactive Currency cannot be selected on a new transaction (Ch.7.8) or
// referenced by a new Exchange Rate (Ch.31.8) — both are guards a future
// caller (Journal Entries, not built yet, and this module's own
// create-exchange-rate.service.ts) enforces at the point of use, not here.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Currency } from "../domain/aggregates/currency.aggregate";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";

export interface DeactivateCurrencyInput {
  currencyUuid: string;
}

export interface DeactivateCurrencyDeps {
  repository: IAccountingRepository;
}

export async function deactivateCurrency(input: DeactivateCurrencyInput, deps: DeactivateCurrencyDeps): Promise<Currency> {
  const { repository } = deps;

  const currency = await repository.findCurrencyByUuid(input.currencyUuid);
  if (!currency) {
    throw new CurrencyNotFoundError(input.currencyUuid);
  }

  currency.deactivate();
  return repository.deactivateCurrency(currency.uuid);
}
