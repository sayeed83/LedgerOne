import { getCurrency, GetCurrencyDeps } from "./get-currency.service";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";
import { buildCurrency, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetCurrencyDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getCurrency", () => {
  it("throws CurrencyNotFoundError when the Currency does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getCurrency({ currencyUuid: "missing-uuid" }, deps)).rejects.toThrow(CurrencyNotFoundError);
  });

  it("returns the Currency when found", async () => {
    const deps = buildDeps();
    const currency = buildCurrency();
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(currency);

    const result = await getCurrency({ currencyUuid: currency.uuid }, deps);

    expect(result).toBe(currency);
    expect(deps.repository.findCurrencyByUuid).toHaveBeenCalledWith(currency.uuid);
  });
});
