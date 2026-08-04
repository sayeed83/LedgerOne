import { getFiscalPeriod, GetFiscalPeriodDeps } from "./get-fiscal-period.service";
import { FiscalPeriodNotFoundError } from "../domain/errors/accounting.errors";
import { buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetFiscalPeriodDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getFiscalPeriod", () => {
  it("throws FiscalPeriodNotFoundError when the Fiscal Period does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FiscalPeriodNotFoundError,
    );
  });

  it("returns the Fiscal Period when found", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

    const result = await getFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid }, deps);

    expect(result).toBe(fiscalPeriod);
  });
});
