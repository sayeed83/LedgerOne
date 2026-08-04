import { softCloseFiscalPeriod, SoftCloseFiscalPeriodDeps } from "./soft-close-fiscal-period.service";
import { FiscalPeriodNotFoundError, InvalidFiscalPeriodStatusTransitionError } from "../domain/errors/accounting.errors";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): SoftCloseFiscalPeriodDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("softCloseFiscalPeriod", () => {
  it("throws FiscalPeriodNotFoundError when the Fiscal Period does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

    await expect(softCloseFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FiscalPeriodNotFoundError,
    );
    expect(deps.repository.softCloseFiscalPeriod).not.toHaveBeenCalled();
  });

  it("soft-closes an Open Fiscal Period", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Open });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
    (deps.repository.softCloseFiscalPeriod as jest.Mock).mockResolvedValue(
      buildFiscalPeriod({ status: FiscalPeriodStatus.SoftClosed }),
    );

    const result = await softCloseFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.softCloseFiscalPeriod).toHaveBeenCalledWith(1n, fiscalPeriod.uuid, 7n);
    expect(result.status).toBe(FiscalPeriodStatus.SoftClosed);
  });

  it.each([FiscalPeriodStatus.SoftClosed, FiscalPeriodStatus.Closed, FiscalPeriodStatus.Reopened])(
    "rejects soft-closing a Fiscal Period that is %s",
    async (status) => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      await expect(
        softCloseFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid }, deps),
      ).rejects.toThrow(InvalidFiscalPeriodStatusTransitionError);
      expect(deps.repository.softCloseFiscalPeriod).not.toHaveBeenCalled();
    },
  );
});
