// Business layer — reads a Currency by its external identifier
// (00_BUSINESS_RULES.md Ch.7.1). Platform-owned reference data (Ch.7.5) — no
// `tenantId` scoping, unlike every other read in this module. Never resolves
// by the internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside
// this module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Currency } from "../domain/aggregates/currency.aggregate";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";

export interface GetCurrencyInput {
  currencyUuid: string;
}

export interface GetCurrencyDeps {
  repository: IAccountingRepository;
}

export async function getCurrency(input: GetCurrencyInput, deps: GetCurrencyDeps): Promise<Currency> {
  const currency = await deps.repository.findCurrencyByUuid(input.currencyUuid);
  if (!currency) {
    throw new CurrencyNotFoundError(input.currencyUuid);
  }
  return currency;
}
