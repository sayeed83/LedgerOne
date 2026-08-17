import { getBalanceSheet, GetBalanceSheetDeps } from "./get-balance-sheet.service";
import { AccountType } from "../../domain/enums/account-type.enum";
import { FinancialYearStatus } from "../../domain/enums/financial-year-status.enum";
import { buildAccount, buildFinancialYear, createFakeAccountingRepository, createFakeLedgerRepository, createFakeClock } from "../test-support/fixtures";

function buildDeps(): GetBalanceSheetDeps {
  return { repository: createFakeAccountingRepository(), ledgerRepository: createFakeLedgerRepository(), clock: createFakeClock() };
}

describe("getBalanceSheet", () => {
  it("returns isBalanced=true when Assets equal Liabilities + Equity (BAL-001)", async () => {
    const deps = buildDeps();
    const asset = buildAccount({ id: 1n, code: "1000", accountType: AccountType.Asset });
    const liability = buildAccount({ id: 2n, code: "2000", accountType: AccountType.Liability });
    const equity = buildAccount({ id: 3n, code: "3000", accountType: AccountType.Equity });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([asset, liability, equity]);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockImplementation((_t, _c, accountIds: bigint[]) => {
      const sums = new Map();
      if (accountIds.includes(1n)) sums.set(1n, { totalDebit: "1000", totalCredit: "0" });
      if (accountIds.includes(2n)) sums.set(2n, { totalDebit: "0", totalCredit: "400" });
      if (accountIds.includes(3n)) sums.set(3n, { totalDebit: "0", totalCredit: "600" });
      return Promise.resolve(sums);
    });

    const result = await getBalanceSheet({ tenantId: 1n, companyUuid: "company-1", asOfDate: new Date("2026-04-30") }, deps);

    expect(result.assets.total.toString()).toBe("1000");
    expect(result.liabilities.total.toString()).toBe("400");
    expect(result.equity.total.toString()).toBe("600");
    expect(result.isBalanced).toBe(true);
  });

  it("includes the covering, not-yet-closed Financial Year's Net Profit as Current Year Earnings within Equity (BAL-002)", async () => {
    const deps = buildDeps();
    const asset = buildAccount({ id: 1n, code: "1000", accountType: AccountType.Asset });
    const revenue = buildAccount({ id: 2n, code: "4000", accountType: AccountType.Revenue });
    const asOfDate = new Date("2026-04-30");
    const financialYear = buildFinancialYear({
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      status: FinancialYearStatus.Open,
    });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([asset, revenue]);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([financialYear]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockImplementation((_t, _c, accountIds: bigint[]) => {
      const sums = new Map();
      if (accountIds.includes(1n)) sums.set(1n, { totalDebit: "500", totalCredit: "0" });
      if (accountIds.includes(2n)) sums.set(2n, { totalDebit: "0", totalCredit: "500" });
      return Promise.resolve(sums);
    });

    const result = await getBalanceSheet({ tenantId: 1n, companyUuid: "company-1", asOfDate }, deps);

    expect(result.currentYearEarnings.toString()).toBe("500");
    expect(result.equity.total.toString()).toBe("500");
  });

  it("excludes Current Year Earnings once the covering Financial Year is Closed (already transferred to Retained Earnings)", async () => {
    const deps = buildDeps();
    const asOfDate = new Date("2026-04-30");
    const closedYear = buildFinancialYear({ startDate: new Date("2026-04-01"), endDate: new Date("2027-03-31"), status: FinancialYearStatus.Closed });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([]);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([closedYear]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map());

    const result = await getBalanceSheet({ tenantId: 1n, companyUuid: "company-1", asOfDate }, deps);

    expect(result.currentYearEarnings.toString()).toBe("0");
  });
});
