import { createExchangeRate, CreateExchangeRateDeps, CreateExchangeRateInput } from "./create-exchange-rate.service";
import {
  CurrencyNotFoundError,
  CurrencyNotActiveError,
  ExchangeRateCurrencyPairNotDistinctError,
  InvalidExchangeRateValueError,
  DuplicateExchangeRateError,
} from "../domain/errors/accounting.errors";
import { CurrencyStatus } from "../domain/enums/currency-status.enum";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { buildCurrency, buildExchangeRate, createFakeAccountingRepository } from "./test-support/fixtures";

const USD = buildCurrency({ id: 1n, uuid: "00000000-0000-0000-0000-000000000201", isoCode: "USD" });
const EUR = buildCurrency({ id: 2n, uuid: "00000000-0000-0000-0000-000000000202", isoCode: "EUR" });

function buildDeps(): CreateExchangeRateDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateExchangeRateInput> = {}): CreateExchangeRateInput {
  return {
    tenantId: 1n,
    fromCurrencyUuid: USD.uuid,
    toCurrencyUuid: EUR.uuid,
    rate: DecimalValue.create("0.9123456789"),
    effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function mockCurrencyLookups(deps: CreateExchangeRateDeps, from: typeof USD | null, to: typeof EUR | null) {
  (deps.repository.findCurrencyByUuid as jest.Mock).mockImplementation(async (uuid: string) => {
    if (uuid === USD.uuid) return from;
    if (uuid === EUR.uuid) return to;
    return null;
  });
}

describe("createExchangeRate", () => {
  it("throws CurrencyNotFoundError when the 'from' Currency does not exist", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, null, EUR);

    await expect(createExchangeRate(buildInput(), deps)).rejects.toThrow(CurrencyNotFoundError);
    expect(deps.repository.createExchangeRate).not.toHaveBeenCalled();
  });

  it("throws CurrencyNotFoundError when the 'to' Currency does not exist", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, USD, null);

    await expect(createExchangeRate(buildInput(), deps)).rejects.toThrow(CurrencyNotFoundError);
  });

  it("throws ExchangeRateCurrencyPairNotDistinctError when 'from' and 'to' are the same Currency", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, USD, USD);

    await expect(
      createExchangeRate(buildInput({ fromCurrencyUuid: USD.uuid, toCurrencyUuid: USD.uuid }), deps),
    ).rejects.toThrow(ExchangeRateCurrencyPairNotDistinctError);
  });

  it("throws CurrencyNotActiveError when the 'from' Currency is Inactive", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, buildCurrency({ ...USD, status: CurrencyStatus.Inactive }), EUR);

    await expect(createExchangeRate(buildInput(), deps)).rejects.toThrow(CurrencyNotActiveError);
  });

  it("throws CurrencyNotActiveError when the 'to' Currency is Inactive", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, USD, buildCurrency({ ...EUR, status: CurrencyStatus.Inactive }));

    await expect(createExchangeRate(buildInput(), deps)).rejects.toThrow(CurrencyNotActiveError);
  });

  it("throws InvalidExchangeRateValueError when the rate is not positive", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, USD, EUR);
    (deps.repository.listExchangeRates as jest.Mock).mockResolvedValue([]);

    await expect(createExchangeRate(buildInput({ rate: DecimalValue.create("0") }), deps)).rejects.toThrow(
      InvalidExchangeRateValueError,
    );
  });

  it("throws DuplicateExchangeRateError when a rate for the same pair and effective date already exists", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, USD, EUR);
    const effectiveDate = new Date("2026-01-01T00:00:00.000Z");
    (deps.repository.listExchangeRates as jest.Mock).mockResolvedValue([buildExchangeRate({ effectiveDate })]);

    await expect(createExchangeRate(buildInput({ effectiveDate }), deps)).rejects.toThrow(DuplicateExchangeRateError);
    expect(deps.repository.createExchangeRate).not.toHaveBeenCalled();
  });

  it("creates the Exchange Rate when every validation passes", async () => {
    const deps = buildDeps();
    mockCurrencyLookups(deps, USD, EUR);
    (deps.repository.listExchangeRates as jest.Mock).mockResolvedValue([]);
    (deps.repository.createExchangeRate as jest.Mock).mockResolvedValue(buildExchangeRate());

    await createExchangeRate(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.createExchangeRate).toHaveBeenCalledWith(1n, {
      fromCurrencyId: USD.id,
      toCurrencyId: EUR.id,
      rate: expect.any(DecimalValue),
      effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
      createdBy: 5n,
    });
  });
});
