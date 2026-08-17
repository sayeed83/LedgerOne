import { getProfitAndLoss, GetProfitAndLossDeps } from "./get-profit-and-loss.service";
import { AccountType } from "../../domain/enums/account-type.enum";
import { ReportScopeRequiredError, InvalidReportDateRangeError } from "../../domain/errors/accounting.errors";
import { buildAccount, createFakeAccountingRepository, createFakeLedgerRepository } from "../test-support/fixtures";

function buildDeps(): GetProfitAndLossDeps {
  return { repository: createFakeAccountingRepository(), ledgerRepository: createFakeLedgerRepository() };
}

describe("getProfitAndLoss", () => {
  it("throws ReportScopeRequiredError when no period is specified", async () => {
    const deps = buildDeps();
    await expect(getProfitAndLoss({ tenantId: 1n, companyUuid: "company-1" }, deps)).rejects.toThrow(ReportScopeRequiredError);
  });

  it("throws InvalidReportDateRangeError when dateFrom is after dateTo", async () => {
    const deps = buildDeps();
    await expect(
      getProfitAndLoss({ tenantId: 1n, companyUuid: "company-1", dateFrom: new Date("2026-06-01"), dateTo: new Date("2026-01-01") }, deps),
    ).rejects.toThrow(InvalidReportDateRangeError);
  });

  it("includes only Revenue and Expense accounts (PNL-001)", async () => {
    const deps = buildDeps();
    const revenue = buildAccount({ id: 1n, code: "4000", accountType: AccountType.Revenue });
    const expense = buildAccount({ id: 2n, code: "5000", accountType: AccountType.Expense });
    const asset = buildAccount({ id: 3n, code: "1000", accountType: AccountType.Asset });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([revenue, expense, asset]);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockImplementation((_tenantId, _companyUuid, accountIds: bigint[]) => {
      const sums = new Map();
      if (accountIds.includes(1n)) sums.set(1n, { totalDebit: "0", totalCredit: "500" });
      if (accountIds.includes(2n)) sums.set(2n, { totalDebit: "200", totalCredit: "0" });
      return Promise.resolve(sums);
    });

    const result = await getProfitAndLoss(
      { tenantId: 1n, companyUuid: "company-1", dateFrom: new Date("2026-04-01"), dateTo: new Date("2026-04-30") },
      deps,
    );

    expect(result.revenue.total.toString()).toBe("500");
    expect(result.expenses.total.toString()).toBe("200");
    // PNL-002: Net Profit = Total Revenue - Total Expenses.
    expect(result.netProfit.toString()).toBe("300");
  });

  it("scopes aggregation to the resolved period's [dateFrom, dateTo] range, not a cumulative-since-inception sum", async () => {
    const deps = buildDeps();
    const revenue = buildAccount({ id: 1n, code: "4000", accountType: AccountType.Revenue });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([revenue]);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map());
    const dateFrom = new Date("2026-04-01");
    const dateTo = new Date("2026-04-30");

    await getProfitAndLoss({ tenantId: 1n, companyUuid: "company-1", dateFrom, dateTo }, deps);

    expect(deps.ledgerRepository.sumLedgerEntriesByAccounts).toHaveBeenCalledWith(1n, "company-1", [1n], dateFrom, dateTo);
  });
});
