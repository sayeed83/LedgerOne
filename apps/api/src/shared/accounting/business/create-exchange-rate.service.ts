// Business layer — defines a new Exchange Rate for a currency pair and
// effective date (00_BUSINESS_RULES.md Ch.31.1/31.3). Resolves both
// Currencies by their external `uuid` first (mirroring Fiscal Period's
// create-fiscal-period.service.ts resolving its parent Financial Year) —
// this both lets the Repository's internal `fromCurrencyId`/`toCurrencyId`
// FKs be populated from the resolved rows rather than trusted as
// separately-supplied internal ids (06_DATABASE_STANDARDS.md PK-003), and is
// where every Ch.31.8 Validation Rule is enforced: the pair must reference
// two distinct, Active Currencies, and the rate value must be positive.
// Also enforces that no Exchange Rate already exists for the same currency
// pair and effective date (Handbook Deviation — see accounting.errors.ts's
// `DuplicateExchangeRateError` doc comment: not explicit Ch.31 text, but
// required to avoid leaking the Database milestone's own unique-constraint
// violation as a raw Prisma error).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { ExchangeRate } from "../domain/entities/exchange-rate.entity";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { CurrencyStatus } from "../domain/enums/currency-status.enum";
import {
  CurrencyNotFoundError,
  CurrencyNotActiveError,
  ExchangeRateCurrencyPairNotDistinctError,
  InvalidExchangeRateValueError,
  DuplicateExchangeRateError,
} from "../domain/errors/accounting.errors";

export interface CreateExchangeRateInput {
  tenantId: bigint;
  fromCurrencyUuid: string;
  toCurrencyUuid: string;
  rate: DecimalValue;
  effectiveDate: Date;
  createdBy?: bigint | null;
}

export interface CreateExchangeRateDeps {
  repository: IAccountingRepository;
}

export async function createExchangeRate(input: CreateExchangeRateInput, deps: CreateExchangeRateDeps): Promise<ExchangeRate> {
  const { repository } = deps;

  const fromCurrency = await repository.findCurrencyByUuid(input.fromCurrencyUuid);
  if (!fromCurrency) {
    throw new CurrencyNotFoundError(input.fromCurrencyUuid);
  }

  const toCurrency = await repository.findCurrencyByUuid(input.toCurrencyUuid);
  if (!toCurrency) {
    throw new CurrencyNotFoundError(input.toCurrencyUuid);
  }

  if (fromCurrency.uuid === toCurrency.uuid) {
    throw new ExchangeRateCurrencyPairNotDistinctError(fromCurrency.uuid);
  }

  if (fromCurrency.status !== CurrencyStatus.Active) {
    throw new CurrencyNotActiveError(fromCurrency.uuid, fromCurrency.status);
  }
  if (toCurrency.status !== CurrencyStatus.Active) {
    throw new CurrencyNotActiveError(toCurrency.uuid, toCurrency.status);
  }

  if (!input.rate.isPositive()) {
    throw new InvalidExchangeRateValueError(input.rate.toString());
  }

  const existingRatesForPair = await repository.listExchangeRates(input.tenantId, fromCurrency.id, toCurrency.id);
  const duplicate = existingRatesForPair.some(
    (existing) => existing.effectiveDate.getTime() === input.effectiveDate.getTime(),
  );
  if (duplicate) {
    throw new DuplicateExchangeRateError(fromCurrency.uuid, toCurrency.uuid, input.effectiveDate);
  }

  return repository.createExchangeRate(input.tenantId, {
    fromCurrencyId: fromCurrency.id,
    toCurrencyId: toCurrency.id,
    rate: input.rate,
    effectiveDate: input.effectiveDate,
    createdBy: input.createdBy ?? null,
  });
}
