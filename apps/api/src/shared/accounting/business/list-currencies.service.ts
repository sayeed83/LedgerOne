// Business layer — lists Currencies, optionally narrowed to a single
// lifecycle status (00_BUSINESS_RULES.md Ch.7.1). Platform-owned reference
// data (Ch.7.5) — no `tenantId` scoping, unlike every other list in this
// module.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Currency } from "../domain/aggregates/currency.aggregate";
import { CurrencyStatus } from "../domain/enums/currency-status.enum";

export interface ListCurrenciesInput {
  status?: CurrencyStatus;
}

export interface ListCurrenciesDeps {
  repository: IAccountingRepository;
}

export async function listCurrencies(input: ListCurrenciesInput, deps: ListCurrenciesDeps): Promise<Currency[]> {
  return deps.repository.listCurrencies(input.status);
}
