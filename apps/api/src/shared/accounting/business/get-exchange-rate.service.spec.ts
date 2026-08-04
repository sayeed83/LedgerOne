import { getExchangeRate, GetExchangeRateDeps } from "./get-exchange-rate.service";
import { ExchangeRateNotFoundError } from "../domain/errors/accounting.errors";
import { buildExchangeRate, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetExchangeRateDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getExchangeRate", () => {
  it("throws ExchangeRateNotFoundError when the Exchange Rate does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findExchangeRateByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getExchangeRate({ tenantId: 1n, exchangeRateUuid: "missing-uuid" }, deps)).rejects.toThrow(
      ExchangeRateNotFoundError,
    );
  });

  it("returns the Exchange Rate when found", async () => {
    const deps = buildDeps();
    const exchangeRate = buildExchangeRate();
    (deps.repository.findExchangeRateByUuid as jest.Mock).mockResolvedValue(exchangeRate);

    const result = await getExchangeRate({ tenantId: 1n, exchangeRateUuid: exchangeRate.uuid }, deps);

    expect(result).toBe(exchangeRate);
    expect(deps.repository.findExchangeRateByUuid).toHaveBeenCalledWith(1n, exchangeRate.uuid);
  });
});
