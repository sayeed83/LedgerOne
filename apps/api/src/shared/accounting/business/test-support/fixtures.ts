// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { FinancialYear } from "../../domain/aggregates/financial-year.aggregate";
import { FinancialYearStatus } from "../../domain/enums/financial-year-status.enum";
import { FiscalPeriod } from "../../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodStatus } from "../../domain/enums/fiscal-period-status.enum";
import { Currency } from "../../domain/aggregates/currency.aggregate";
import { CurrencyStatus } from "../../domain/enums/currency-status.enum";
import { ExchangeRate } from "../../domain/entities/exchange-rate.entity";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";

export function buildFinancialYear(overrides: Partial<FinancialYear> = {}): FinancialYear {
  const base = new FinancialYear(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "00000000-0000-0000-0000-000000000100",
    new Date("2026-04-01T00:00:00.000Z"),
    new Date("2027-03-31T00:00:00.000Z"),
    FinancialYearStatus.Future,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(FinancialYear.prototype), base, overrides) as FinancialYear;
}

export function buildFiscalPeriod(overrides: Partial<FiscalPeriod> = {}): FiscalPeriod {
  const base = new FiscalPeriod(
    1n,
    "00000000-0000-0000-0000-000000000010",
    1n,
    "00000000-0000-0000-0000-000000000100",
    1n,
    new Date("2026-04-01T00:00:00.000Z"),
    new Date("2026-04-30T00:00:00.000Z"),
    FiscalPeriodStatus.Open,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(FiscalPeriod.prototype), base, overrides) as FiscalPeriod;
}

export function buildCurrency(overrides: Partial<Currency> = {}): Currency {
  const base = new Currency(
    1n,
    "00000000-0000-0000-0000-000000000200",
    "USD",
    "US Dollar",
    "$",
    2,
    CurrencyStatus.Active,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
  );
  return Object.assign(Object.create(Currency.prototype), base, overrides) as Currency;
}

export function buildExchangeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  const base = new ExchangeRate(
    1n,
    "00000000-0000-0000-0000-000000000300",
    1n,
    1n,
    2n,
    DecimalValue.create("83.0000000000"),
    new Date("2026-03-15T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(ExchangeRate.prototype), base, overrides) as ExchangeRate;
}

export function createFakeAccountingRepository(): jest.Mocked<IAccountingRepository> {
  return {
    createFinancialYear: jest.fn(),
    findFinancialYearByUuid: jest.fn(),
    listFinancialYears: jest.fn(),
    updateFinancialYear: jest.fn(),
    openFinancialYear: jest.fn(),
    closeFinancialYear: jest.fn(),
    reopenFinancialYear: jest.fn(),
    createFiscalPeriod: jest.fn(),
    findFiscalPeriodByUuid: jest.fn(),
    listFiscalPeriods: jest.fn(),
    updateFiscalPeriod: jest.fn(),
    openFiscalPeriod: jest.fn(),
    softCloseFiscalPeriod: jest.fn(),
    closeFiscalPeriod: jest.fn(),
    reopenFiscalPeriod: jest.fn(),
    createCurrency: jest.fn(),
    findCurrencyByUuid: jest.fn(),
    findCurrencyByIsoCode: jest.fn(),
    listCurrencies: jest.fn(),
    updateCurrency: jest.fn(),
    activateCurrency: jest.fn(),
    deactivateCurrency: jest.fn(),
    createExchangeRate: jest.fn(),
    findExchangeRateByUuid: jest.fn(),
    listExchangeRates: jest.fn(),
  };
}
