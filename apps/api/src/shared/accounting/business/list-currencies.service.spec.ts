import { listCurrencies } from "./list-currencies.service";
import { CurrencyStatus } from "../domain/enums/currency-status.enum";
import { buildCurrency, createFakeAccountingRepository } from "./test-support/fixtures";

describe("listCurrencies", () => {
  it("lists every Currency when no status filter is supplied", async () => {
    const repository = createFakeAccountingRepository();
    const currencies = [buildCurrency()];
    (repository.listCurrencies as jest.Mock).mockResolvedValue(currencies);

    const result = await listCurrencies({}, { repository });

    expect(repository.listCurrencies).toHaveBeenCalledWith(undefined);
    expect(result).toBe(currencies);
  });

  it("passes the status filter through to the repository", async () => {
    const repository = createFakeAccountingRepository();
    (repository.listCurrencies as jest.Mock).mockResolvedValue([]);

    await listCurrencies({ status: CurrencyStatus.Active }, { repository });

    expect(repository.listCurrencies).toHaveBeenCalledWith(CurrencyStatus.Active);
  });
});
