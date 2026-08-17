import { getCashFlow, GetCashFlowDeps } from "./get-cash-flow.service";
import { AccountType } from "../../domain/enums/account-type.enum";
import { buildAccount, buildAccountGroup, createFakeAccountingRepository, createFakeLedgerRepository } from "../test-support/fixtures";

function buildDeps(): GetCashFlowDeps {
  return { repository: createFakeAccountingRepository(), ledgerRepository: createFakeLedgerRepository() };
}

describe("getCashFlow", () => {
  it("reconciles Net Profit plus the non-cash Balance Sheet movement to the actual Cash account change (CFL-001/CFL-002)", async () => {
    const deps = buildDeps();
    const cashGroup = buildAccountGroup({ id: 10n, name: "Cash and Bank", accountType: AccountType.Asset });
    const receivablesGroup = buildAccountGroup({ id: 20n, name: "Receivables", accountType: AccountType.Asset });
    const equityGroup = buildAccountGroup({ id: 30n, name: "Equity", accountType: AccountType.Equity });

    const cash = buildAccount({ id: 1n, code: "1000", accountType: AccountType.Asset, accountGroupId: 10n });
    const revenue = buildAccount({ id: 2n, code: "4000", accountType: AccountType.Revenue, accountGroupId: 40n });
    const receivable = buildAccount({ id: 3n, code: "1100", accountType: AccountType.Asset, accountGroupId: 20n });
    const shareCapital = buildAccount({ id: 4n, code: "3000", accountType: AccountType.Equity, accountGroupId: 30n });

    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([cash, revenue, receivable, shareCapital]);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([cashGroup, receivablesGroup, equityGroup]);

    const periodStart = new Date("2026-04-01");
    const periodEnd = new Date("2026-04-30");

    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockImplementation(
      (_t, _c, accountIds: bigint[], _dateFrom, dateTo: Date) => {
        const sums = new Map();
        const atEnd = dateTo.getTime() === periodEnd.getTime();
        // Revenue earned this period ($500) sits in Revenue until closing.
        if (accountIds.includes(2n) && dateTo.getTime() === periodEnd.getTime()) {
          sums.set(2n, { totalDebit: "0", totalCredit: "500" });
        }
        // Receivable grows by $200 over the period (uses cash, non-cash asset up).
        if (accountIds.includes(3n)) {
          sums.set(3n, atEnd ? { totalDebit: "200", totalCredit: "0" } : { totalDebit: "0", totalCredit: "0" });
        }
        // Share Capital grows by $100 over the period (financing inflow, lumped into the simplified bucket).
        if (accountIds.includes(4n)) {
          sums.set(4n, atEnd ? { totalDebit: "0", totalCredit: "100" } : { totalDebit: "0", totalCredit: "0" });
        }
        // Cash actually grows by exactly netProfit(500) - receivableIncrease(200) + shareCapitalIncrease(100) = 400.
        if (accountIds.includes(1n)) {
          sums.set(1n, atEnd ? { totalDebit: "400", totalCredit: "0" } : { totalDebit: "0", totalCredit: "0" });
        }
        return Promise.resolve(sums);
      },
    );

    const result = await getCashFlow({ tenantId: 1n, companyUuid: "company-1", dateFrom: periodStart, dateTo: periodEnd }, deps);

    expect(result.netProfit.toString()).toBe("500");
    expect(result.operatingAdjustment.toString()).toBe("-100");
    expect(result.netCashFlow.toString()).toBe("400");
    expect(result.actualCashChange.toString()).toBe("400");
    expect(result.reconciles).toBe(true);
  });

  it("identifies Cash/Bank accounts by Account Group name, excluding them from the non-cash adjustment", async () => {
    const deps = buildDeps();
    const cashGroup = buildAccountGroup({ id: 10n, name: "Petty Cash", accountType: AccountType.Asset });
    const cash = buildAccount({ id: 1n, code: "1000", accountType: AccountType.Asset, accountGroupId: 10n });
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([cash]);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([cashGroup]);
    (deps.ledgerRepository.sumLedgerEntriesByAccounts as jest.Mock).mockResolvedValue(new Map());

    const result = await getCashFlow(
      { tenantId: 1n, companyUuid: "company-1", dateFrom: new Date("2026-04-01"), dateTo: new Date("2026-04-30") },
      deps,
    );

    // With the only Account classified as Cash/Bank, the non-cash adjustment set is empty — no working-capital adjustment to make.
    expect(result.operatingAdjustment.toString()).toBe("0");
  });
});
