import { updateFiscalPeriod, UpdateFiscalPeriodDeps } from "./update-fiscal-period.service";
import { FiscalPeriodNotFoundError, FiscalPeriodOverlapError, FiscalPeriodClosedError } from "../domain/errors/accounting.errors";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): UpdateFiscalPeriodDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("updateFiscalPeriod", () => {
  it("throws FiscalPeriodNotFoundError when the Fiscal Period does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: "missing-uuid", startDate: new Date() }, deps),
    ).rejects.toThrow(FiscalPeriodNotFoundError);
    expect(deps.repository.updateFiscalPeriod).not.toHaveBeenCalled();
  });

  it("throws FiscalPeriodClosedError when the Fiscal Period is Closed", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Closed });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

    await expect(
      updateFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid, endDate: new Date() }, deps),
    ).rejects.toThrow(FiscalPeriodClosedError);
    expect(deps.repository.updateFiscalPeriod).not.toHaveBeenCalled();
  });

  it("throws FiscalPeriodOverlapError when the revised range overlaps another Fiscal Period in the same Financial Year", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod({
      uuid: "00000000-0000-0000-0000-000000000010",
      financialYearId: 10n,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
    });
    const other = buildFiscalPeriod({
      uuid: "00000000-0000-0000-0000-000000000099",
      financialYearId: 10n,
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-05-31T00:00:00.000Z"),
    });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([fiscalPeriod, other]);

    await expect(
      updateFiscalPeriod(
        { tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid, endDate: new Date("2026-05-10T00:00:00.000Z") },
        deps,
      ),
    ).rejects.toThrow(FiscalPeriodOverlapError);
    expect(deps.repository.updateFiscalPeriod).not.toHaveBeenCalled();
  });

  it("excludes the Fiscal Period being revised from its own overlap check", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod({
      uuid: "00000000-0000-0000-0000-000000000010",
      financialYearId: 10n,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
    });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([fiscalPeriod]);
    (deps.repository.updateFiscalPeriod as jest.Mock).mockResolvedValue(
      buildFiscalPeriod({ endDate: new Date("2026-04-29T00:00:00.000Z") }),
    );

    await updateFiscalPeriod(
      { tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid, endDate: new Date("2026-04-29T00:00:00.000Z"), updatedBy: 3n },
      deps,
    );

    expect(deps.repository.updateFiscalPeriod).toHaveBeenCalledWith(1n, fiscalPeriod.uuid, {
      startDate: undefined,
      endDate: new Date("2026-04-29T00:00:00.000Z"),
      updatedBy: 3n,
    });
  });

  it("skips the overlap check when neither date is being changed", async () => {
    const deps = buildDeps();
    const fiscalPeriod = buildFiscalPeriod();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
    (deps.repository.updateFiscalPeriod as jest.Mock).mockResolvedValue(fiscalPeriod);

    await updateFiscalPeriod({ tenantId: 1n, fiscalPeriodUuid: fiscalPeriod.uuid, updatedBy: null }, deps);

    expect(deps.repository.listFiscalPeriods).not.toHaveBeenCalled();
    expect(deps.repository.updateFiscalPeriod).toHaveBeenCalledWith(1n, fiscalPeriod.uuid, {
      startDate: undefined,
      endDate: undefined,
      updatedBy: null,
    });
  });
});
