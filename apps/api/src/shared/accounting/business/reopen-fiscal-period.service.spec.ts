import { reopenFiscalPeriod, ReopenFiscalPeriodDeps } from "./reopen-fiscal-period.service";
import { FiscalPeriodNotFoundError, InvalidFiscalPeriodStatusTransitionError } from "../domain/errors/accounting.errors";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ReopenFiscalPeriodDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("reopenFiscalPeriod", () => {
  it("throws FiscalPeriodNotFoundError when the Fiscal Period does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

    await expect(reopenFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FiscalPeriodNotFoundError,
    );
    expect(deps.repository.reopenFiscalPeriod).not.toHaveBeenCalled();
  });

  it("reopens a Closed Fiscal Period", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Closed });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
    (deps.repository.reopenFiscalPeriod as jest.Mock).mockResolvedValue(
      buildFiscalPeriod({ status: FiscalPeriodStatus.Reopened }),
    );

    const result = await reopenFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.reopenFiscalPeriod).toHaveBeenCalledWith(1n, fiscalPeriod.uuid, 7n);
    expect(result.status).toBe(FiscalPeriodStatus.Reopened);
  });

  it.each([FiscalPeriodStatus.Open, FiscalPeriodStatus.SoftClosed, FiscalPeriodStatus.Reopened])(
    "rejects reopening a Fiscal Period that is %s",
    async (status) => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      await expect(
        reopenFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid }, deps),
      ).rejects.toThrow(InvalidFiscalPeriodStatusTransitionError);
      expect(deps.repository.reopenFiscalPeriod).not.toHaveBeenCalled();
    },
  );
});
