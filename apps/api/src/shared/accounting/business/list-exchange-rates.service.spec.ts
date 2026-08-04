import { listExchangeRates } from "./list-exchange-rates.service";
import { CurrencyNotFoundError } from "../domain/errors/accounting.errors";
import { buildCurrency, buildExchangeRate, createFakeAccountingRepository } from "./test-support/fixtures";

const USD = buildCurrency({ id: 1n, uuid: "00000000-0000-0000-0000-000000000201", isoCode: "USD" });
const EUR = buildCurrency({ id: 2n, uuid: "00000000-0000-0000-0000-000000000202", isoCode: "EUR" });

describe("listExchangeRates", () => {
  it("lists every Exchange Rate for the tenant when no currency filter is supplied", async () => {
    const repository = createFakeAccountingRepository();
    const rates = [buildExchangeRate()];
    (repository.listExchangeRates as jest.Mock).mockResolvedValue(rates);

    const result = await listExchangeRates({ tenantId: 1n }, { repository });

    expect(repository.listExchangeRates).toHaveBeenCalledWith(1n, undefined, undefined);
    expect(result).toBe(rates);
  });

  it("throws CurrencyNotFoundError when fromCurrencyUuid does not resolve", async () => {
    const repository = createFakeAccountingRepository();
    (repository.findCurrencyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      listExchangeRates({ tenantId: 1n, fromCurrencyUuid: "missing-uuid" }, { repository }),
    ).rejects.toThrow(CurrencyNotFoundError);
    expect(repository.listExchangeRates).not.toHaveBeenCalled();
  });

  it("resolves both currency uuids to internal ids before filtering", async () => {
    const repository = createFakeAccountingRepository();
    (repository.findCurrencyByUuid as jest.Mock).mockImplementation(async (uuid: string) => {
      if (uuid === USD.uuid) return USD;
      if (uuid === EUR.uuid) return EUR;
      return null;
    });
    (repository.listExchangeRates as jest.Mock).mockResolvedValue([]);

    await listExchangeRates({ tenantId: 1n, fromCurrencyUuid: USD.uuid, toCurrencyUuid: EUR.uuid }, { repository });

    expect(repository.listExchangeRates).toHaveBeenCalledWith(1n, USD.id, EUR.id);
  });
});
