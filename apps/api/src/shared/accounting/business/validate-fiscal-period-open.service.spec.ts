import { validateFiscalPeriodOpen, ValidateFiscalPeriodOpenDeps } from "./validate-fiscal-period-open.service";
import { FiscalPeriodNotFoundError, FiscalPeriodNotOpenError } from "../domain/errors/accounting.errors";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ValidateFiscalPeriodOpenDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("validateFiscalPeriodOpen", () => {
  it("throws FiscalPeriodNotFoundError when the Fiscal Period does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      validateFiscalPeriodOpen({ tenantId: 1n, fiscalPeriodUuid: "missing-uuid" }, deps),
    ).rejects.toThrow(FiscalPeriodNotFoundError);
  });

  it("returns the Fiscal Period when it is Open", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Open });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

    const result = await validateFiscalPeriodOpen({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid }, deps);

    expect(result).toBe(fiscalPeriod);
  });

  it.each([FiscalPeriodStatus.SoftClosed, FiscalPeriodStatus.Closed, FiscalPeriodStatus.Reopened])(
    "throws FiscalPeriodNotOpenError when the status is %s",
    async (status) => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      await expect(
        validateFiscalPeriodOpen({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid }, deps),
      ).rejects.toThrow(FiscalPeriodNotOpenError);
    },
  );
});
