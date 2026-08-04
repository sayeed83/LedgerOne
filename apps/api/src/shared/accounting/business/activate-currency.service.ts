// Business layer — transitions a Currency to Active
// (00_BUSINESS_RULES.md Ch.7.5/7.8): valid only from Inactive. The Domain
// aggregate's `activate()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Currency } from "../domain/aggregates/currency.aggregate";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";

export interface ActivateCurrencyInput {
  currencyUuid: string;
}

export interface ActivateCurrencyDeps {
  repository: IAccountingRepository;
}

export async function activateCurrency(input: ActivateCurrencyInput, deps: ActivateCurrencyDeps): Promise<Currency> {
  const { repository } = deps;

  const currency = await repository.findCurrencyByUuid(input.currencyUuid);
  if (!currency) {
    throw new CurrencyNotFoundError(input.currencyUuid);
  }

  currency.activate();
  return repository.activateCurrency(currency.uuid);
}
