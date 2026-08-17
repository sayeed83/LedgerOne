import { getClosingReadiness, GetClosingReadinessDeps } from "./get-closing-readiness.service";
import { FiscalPeriodStatus } from "../../domain/enums/fiscal-period-status.enum";
import { FiscalPeriodNotFoundError } from "../../domain/errors/accounting.errors";
import { buildAccount, buildFiscalPeriod, createFakeAccountingRepository, createFakeLedgerRepository, createFakeClock } from "../test-support/fixtures";

function buildDeps(): GetClosingReadinessDeps {
  return { repository: createFakeAccountingRepository(), ledgerRepository: createFakeLedgerRepository(), clock: createFakeClock() };
}

describe("getClosingReadiness", () => {
  it("throws FiscalPeriodNotFoundError when the Fiscal Period does not exist for the Tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getClosingReadiness({ tenantId: 1n, companyUuid: "company-1", fiscalPeriodUuid: "missing" }, deps)).rejects.toThrow(
      FiscalPeriodNotFoundError,
    );
  });

  it("is ready to close when the Trial Balance balances and every prior period is Closed (CLS-001/CLS-002)", async () => {
    const deps = buildDeps();
    const financialYearId = 9n;
    const period = buildFiscalPeriod({
      uuid: "period-2",
      financialYearId,
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-31"),
      status: FiscalPeriodStatus.SoftClosed,
    });
    const priorPeriod = buildFiscalPeriod({
      uuid: "period-1",
      financialYearId,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      status: FiscalPeriodStatus.Closed,
    });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(period);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([priorPeriod, period]);
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map());

    const result = await getClosingReadiness({ tenantId: 1n, companyUuid: "company-1", fiscalPeriodUuid: period.uuid }, deps);

    expect(result.trialBalanceBalanced).toBe(true);
    expect(result.priorPeriodsClosed).toBe(true);
    expect(result.readyToClose).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(deps.repository.listFiscalPeriods).toHaveBeenCalledWith(1n, financialYearId);
  });

  it("is not ready to close when an earlier Fiscal Period in the same Financial Year is not yet Closed (CLS-002)", async () => {
    const deps = buildDeps();
    const financialYearId = 9n;
    const period = buildFiscalPeriod({ uuid: "period-2", financialYearId, startDate: new Date("2026-05-01"), endDate: new Date("2026-05-31") });
    const priorPeriod = buildFiscalPeriod({
      uuid: "period-1",
      financialYearId,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      status: FiscalPeriodStatus.Open,
    });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(period);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([priorPeriod, period]);
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map());

    const result = await getClosingReadiness({ tenantId: 1n, companyUuid: "company-1", fiscalPeriodUuid: period.uuid }, deps);

    expect(result.priorPeriodsClosed).toBe(false);
    expect(result.readyToClose).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("is not ready to close when the Trial Balance does not balance (CLS-001)", async () => {
    const deps = buildDeps();
    const period = buildFiscalPeriod({ uuid: "period-1", financialYearId: 9n });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(period);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([period]);
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([buildAccount({ id: 1n, code: "1000" })]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map([[1n, { totalDebit: "500", totalCredit: "0" }]]));

    const result = await getClosingReadiness({ tenantId: 1n, companyUuid: "company-1", fiscalPeriodUuid: period.uuid }, deps);

    expect(result.trialBalanceBalanced).toBe(false);
    expect(result.readyToClose).toBe(false);
  });
});
