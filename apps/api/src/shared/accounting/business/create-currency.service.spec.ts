import { createCurrency, CreateCurrencyDeps, CreateCurrencyInput } from "./create-currency.service";
import { DuplicateCurrencyIsoCodeError } from "../domain/errors/accounting.errors";
import { buildCurrency, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CreateCurrencyDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateCurrencyInput> = {}): CreateCurrencyInput {
  return {
    isoCode: "USD",
    name: "US Dollar",
    symbol: "$",
    decimalPrecision: 2,
    ...overrides,
  };
}

describe("createCurrency", () => {
  it("throws DuplicateCurrencyIsoCodeError when the ISO code already exists", async () => {
    const deps = buildDeps();
    (deps.repository.findCurrencyByIsoCode as jest.Mock).mockResolvedValue(buildCurrency({ isoCode: "USD" }));

    await expect(createCurrency(buildInput(), deps)).rejects.toThrow(DuplicateCurrencyIsoCodeError);
    expect(deps.repository.createCurrency).not.toHaveBeenCalled();
  });

  it("creates the Currency when the ISO code is not already in use", async () => {
    const deps = buildDeps();
    (deps.repository.findCurrencyByIsoCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.createCurrency as jest.Mock).mockResolvedValue(buildCurrency());

    await createCurrency(buildInput(), deps);

    expect(deps.repository.findCurrencyByIsoCode).toHaveBeenCalledWith("USD");
    expect(deps.repository.createCurrency).toHaveBeenCalledWith({
      isoCode: "USD",
      name: "US Dollar",
      symbol: "$",
      decimalPrecision: 2,
    });
  });
});
