import { deactivateCurrency, DeactivateCurrencyDeps } from "./deactivate-currency.service";
import { CurrencyNotFoundError, InvalidCurrencyStatusTransitionError } from "../domain/errors/accounting.errors";
import { CurrencyStatus } from "../domain/enums/currency-status.enum";
import { buildCurrency, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): DeactivateCurrencyDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("deactivateCurrency", () => {
  it("throws CurrencyNotFoundError when the Currency does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(deactivateCurrency({ currencyUuid: "missing-uuid" }, deps)).rejects.toThrow(CurrencyNotFoundError);
    expect(deps.repository.deactivateCurrency).not.toHaveBeenCalled();
  });

  it("deactivates an Active Currency", async () => {
    const deps = buildDeps();
    const currency = buildCurrency({ status: CurrencyStatus.Active });
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(currency);
    (deps.repository.deactivateCurrency as jest.Mock).mockResolvedValue(
      buildCurrency({ status: CurrencyStatus.Inactive }),
    );

    const result = await deactivateCurrency({ currencyUuid: currency.uuid }, deps);

    expect(deps.repository.deactivateCurrency).toHaveBeenCalledWith(currency.uuid);
    expect(result.status).toBe(CurrencyStatus.Inactive);
  });

  it("rejects deactivating an already-Inactive Currency", async () => {
    const deps = buildDeps();
    const currency = buildCurrency({ status: CurrencyStatus.Inactive });
    (deps.repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(currency);

    await expect(deactivateCurrency({ currencyUuid: currency.uuid }, deps)).rejects.toThrow(
      InvalidCurrencyStatusTransitionError,
    );
    expect(deps.repository.deactivateCurrency).not.toHaveBeenCalled();
  });
});
