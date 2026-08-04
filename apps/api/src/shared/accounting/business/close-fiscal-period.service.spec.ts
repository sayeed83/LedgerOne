import { closeFiscalPeriod, CloseFiscalPeriodDeps } from "./close-fiscal-period.service";
import { FiscalPeriodNotFoundError, InvalidFiscalPeriodStatusTransitionError } from "../domain/errors/accounting.errors";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CloseFiscalPeriodDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("closeFiscalPeriod", () => {
  it("throws FiscalPeriodNotFoundError when the Fiscal Period does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

    await expect(closeFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FiscalPeriodNotFoundError,
    );
    expect(deps.repository.closeFiscalPeriod).not.toHaveBeenCalled();
  });

  it.each([FiscalPeriodStatus.SoftClosed, FiscalPeriodStatus.Reopened])(
    "closes a Fiscal Period that is %s",
    async (status) => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
      (deps.repository.closeFiscalPeriod as jest.Mock).mockResolvedValue(
        buildFiscalPeriod({ status: FiscalPeriodStatus.Closed }),
      );

      const result = await closeFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid, updatedBy: 7n }, deps);

      expect(deps.repository.closeFiscalPeriod).toHaveBeenCalledWith(1n, fiscalPeriod.uuid, 7n);
      expect(result.status).toBe(FiscalPeriodStatus.Closed);
    },
  );

  it.each([FiscalPeriodStatus.Open, FiscalPeriodStatus.Closed])(
    "rejects closing a Fiscal Period that is %s",
    async (status) => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      await expect(closeFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid }, deps)).rejects.toThrow(
        InvalidFiscalPeriodStatusTransitionError,
      );
      expect(deps.repository.closeFiscalPeriod).not.toHaveBeenCalled();
    },
  );
});
