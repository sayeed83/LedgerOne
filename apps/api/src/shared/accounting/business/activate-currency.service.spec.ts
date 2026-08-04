import { activateCurrency, ActivateCurrencyDeps } from "./activate-currency.service";
import { CurrencyNotFoundError, InvalidCurrencyStatusTransitionError } from "../domain/errors/accounting.errors";
import { CurrencyStatus } from "../domain/enums/currency-status.enum";
import { buildCurrency, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ActivateCurrencyDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("activateCurrency", () => {
  it("throws CurrencyNotFoundError when the Currency does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(activateCurrency({ currencyUuid: "missing-uuid" }, deps)).rejects.toThrow(CurrencyNotFoundError);
    expect(deps.repository.activateCurrency).not.toHaveBeenCalled();
  });

  it("activates an Inactive Currency", async () => {
    const deps = buildDeps();
    const currency = buildCurrency({ status: CurrencyStatus.Inactive });
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(currency);
    (deps.repository.activateCurrency as jest.Mock).mockResolvedValue(buildCurrency({ status: CurrencyStatus.Active }));

    const result = await activateCurrency({ currencyUuid: currency.uuid }, deps);

    expect(deps.repository.activateCurrency).toHaveBeenCalledWith(currency.uuid);
    expect(result.status).toBe(CurrencyStatus.Active);
  });

  it("rejects activating an already-Active Currency", async () => {
    const deps = buildDeps();
    const currency = buildCurrency({ status: CurrencyStatus.Active });
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(currency);

    await expect(activateCurrency({ currencyUuid: currency.uuid }, deps)).rejects.toThrow(
      InvalidCurrencyStatusTransitionError,
    );
    expect(deps.repository.activateCurrency).not.toHaveBeenCalled();
  });
});
