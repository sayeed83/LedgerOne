import { getTrialBalance, GetTrialBalanceDeps } from "./get-trial-balance.service";
import { AccountType } from "../../domain/enums/account-type.enum";
import { FiscalPeriodStatus } from "../../domain/enums/fiscal-period-status.enum";
import { buildAccount, buildFiscalPeriod, createFakeAccountingRepository, createFakeLedgerRepository, createFakeClock } from "../test-support/fixtures";

function buildDeps(): GetTrialBalanceDeps {
  return { repository: createFakeAccountingRepository(), ledgerRepository: createFakeLedgerRepository(), clock: createFakeClock() };
}

describe("getTrialBalance", () => {
  it("returns isBalanced=true when total debit equals total credit (TRB-001)", async () => {
    const deps = buildDeps();
    const asset = buildAccount({ id: 1n, code: "1000", accountType: AccountType.Asset });
    const revenue = buildAccount({ id: 2n, code: "4000", accountType: AccountType.Revenue });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([asset, revenue]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(
      new Map([
        [1n, { totalDebit: "1000", totalCredit: "0" }],
        [2n, { totalDebit: "0", totalCredit: "1000" }],
      ]),
    );

    const result = await getTrialBalance({ tenantId: 1n, companyUuid: "company-1" }, deps);

    expect(result.totalDebit.toString()).toBe("1000");
    expect(result.totalCredit.toString()).toBe("1000");
    expect(result.isBalanced).toBe(true);
  });

  it("returns isBalanced=false, as a data field rather than throwing, when debits and credits differ (Ch.24.12)", async () => {
    const deps = buildDeps();
    const asset = buildAccount({ id: 1n, code: "1000", accountType: AccountType.Asset });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([asset]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map([[1n, { totalDebit: "1000", totalCredit: "0" }]]));

    const result = await getTrialBalance({ tenantId: 1n, companyUuid: "company-1" }, deps);

    expect(result.isBalanced).toBe(false);
  });

  it("excludes zero-activity accounts by default, includes them when includeZeroActivity is set (TRB-002)", async () => {
    const deps = buildDeps();
    const active = buildAccount({ id: 1n, code: "1000" });
    const dormant = buildAccount({ id: 2n, code: "2000" });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([active, dormant]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map([[1n, { totalDebit: "500", totalCredit: "0" }]]));

    const withoutZero = await getTrialBalance({ tenantId: 1n, companyUuid: "company-1" }, deps);
    expect(withoutZero.rows.map((row) => row.account.code)).toEqual(["1000"]);

    const withZero = await getTrialBalance({ tenantId: 1n, companyUuid: "company-1", includeZeroActivity: true }, deps);
    expect(withZero.rows.map((row) => row.account.code).sort()).toEqual(["1000", "2000"]);
  });

  it("resolves asOfDate from a Fiscal Period and marks the report provisional when the period is not Closed", async () => {
    const deps = buildDeps();
    const period = buildFiscalPeriod({ endDate: new Date("2026-04-30T00:00:00.000Z"), status: FiscalPeriodStatus.Open });
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(period);
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map());

    const result = await getTrialBalance({ tenantId: 1n, companyUuid: "company-1", fiscalPeriodUuid: period.uuid }, deps);

    expect(result.asOfDate).toEqual(period.endDate);
    expect(result.isProvisional).toBe(true);
  });

  it("paginates rows by account code while totaling over the full filtered set, not just the returned page", async () => {
    const deps = buildDeps();
    const accounts = [
      buildAccount({ id: 1n, code: "1000" }),
      buildAccount({ id: 2n, code: "2000" }),
      buildAccount({ id: 3n, code: "3000" }),
    ];
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue(accounts);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(
      new Map([
        [1n, { totalDebit: "100", totalCredit: "0" }],
        [2n, { totalDebit: "100", totalCredit: "0" }],
        [3n, { totalDebit: "100", totalCredit: "0" }],
      ]),
    );

    const result = await getTrialBalance({ tenantId: 1n, companyUuid: "company-1", limit: 2 }, deps);

    expect(result.rows.map((row) => row.account.code)).toEqual(["1000", "2000"]);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.totalDebit.toString()).toBe("300");
  });
});
