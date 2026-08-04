import { updateCurrency, UpdateCurrencyDeps } from "./update-currency.service";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";
import { buildCurrency, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): UpdateCurrencyDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("updateCurrency", () => {
  it("throws CurrencyNotFoundError when the Currency does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(updateCurrency({ currencyUuid: "missing-uuid", name: "New Name" }, deps)).rejects.toThrow(
      CurrencyNotFoundError,
    );
    expect(deps.repository.updateCurrency).not.toHaveBeenCalled();
  });

  it("revises the Currency's descriptive fields", async () => {
    const deps = buildDeps();
    const currency = buildCurrency();
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(currency);
    (deps.repository.updateCurrency as jest.Mock).mockResolvedValue(buildCurrency({ name: "United States Dollar" }));

    await updateCurrency({ currencyUuid: currency.uuid, name: "United States Dollar", decimalPrecision: 4 }, deps);

    expect(deps.repository.updateCurrency).toHaveBeenCalledWith(currency.uuid, {
      name: "United States Dollar",
      symbol: undefined,
      decimalPrecision: 4,
    });
  });
});
