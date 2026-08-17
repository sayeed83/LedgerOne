// Business layer — Balance Sheet (00_BUSINESS_RULES.md Ch.26). BAL-001:
// Assets = Liabilities + Equity as of the report date (surfaced as
// `isBalanced`, never thrown — same read-only reporting posture as Trial
// Balance's TRB-001). BAL-002: the current, not-yet-closed period's Net
// Profit/Loss is included within Equity as "Current Year Earnings" until
// Financial Closing (Ch.32) transfers it to Retained Earnings — computed
// here by internally composing `get-profit-and-loss.service.ts` scoped
// `[financialYear.startDate, asOfDate]`, never a second, separate P&L
// calculation. The covering Financial Year is resolved via the existing
// `listFinancialYears(tenantId, companyUuid)` (no new Repository method
// needed — a Financial Year "covering" a date is a plain in-memory
// date-range filter over an already-small list). Sections are returned in
// full (grouped by Account Group), not cursor-paginated — same reasoning as
// `get-profit-and-loss.service.ts`'s own header comment.
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";
import { ILedgerRepository } from "../../domain/interfaces/ledger-repository.interface";
import { IClock } from "../../domain/interfaces/clock.interface";
import { AccountType } from "../../domain/enums/account-type.enum";
import { FinancialYearStatus } from "../../domain/enums/financial-year-status.enum";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";
import { resolvePointInTimeScope } from "./resolve-report-scope.service";
import { aggregateAccountBalances, sumBalances } from "./aggregate-account-balances.service";
import { filterAccountsByType } from "./filter-accounts-by-type";
import { groupBalancesByAccountGroup } from "./group-balances-by-account-group.service";
import { getProfitAndLoss } from "./get-profit-and-loss.service";
import { GroupedBalanceNode } from "./reporting-types";

export interface GetBalanceSheetInput {
  tenantId: bigint;
  companyUuid: string;
  asOfDate?: Date;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
}

export interface GetBalanceSheetDeps {
  repository: IAccountingRepository;
  ledgerRepository: ILedgerRepository;
  clock: IClock;
}

export interface BalanceSheetSection {
  groups: GroupedBalanceNode[];
  total: DecimalValue;
}

export interface BalanceSheetResult {
  asOfDate: Date;
  isProvisional: boolean;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  /** `equity.total` already includes `currentYearEarnings` (BAL-002). */
  equity: BalanceSheetSection;
  currentYearEarnings: DecimalValue;
  isBalanced: boolean;
}

const ZERO = DecimalValue.create("0");

export async function getBalanceSheet(input: GetBalanceSheetInput, deps: GetBalanceSheetDeps): Promise<BalanceSheetResult> {
  const scope = await resolvePointInTimeScope(
    { tenantId: input.tenantId, asOfDate: input.asOfDate, fiscalPeriodUuid: input.fiscalPeriodUuid, financialYearUuid: input.financialYearUuid },
    deps.repository,
    deps.clock,
  );

  const [accounts, accountGroups] = await Promise.all([
    deps.repository.listAccounts(input.tenantId, input.companyUuid),
    deps.repository.listAccountGroups(input.tenantId, input.companyUuid),
  ]);

  const assetAccounts = filterAccountsByType(accounts, [AccountType.Asset]);
  const liabilityAccounts = filterAccountsByType(accounts, [AccountType.Liability]);
  const equityAccounts = filterAccountsByType(accounts, [AccountType.Equity]);

  const dateRange = { dateTo: scope.asOfDate };
  const [assetBalances, liabilityBalances, equityBalances] = await Promise.all([
    aggregateAccountBalances(input.tenantId, input.companyUuid, assetAccounts, dateRange, deps.ledgerRepository),
    aggregateAccountBalances(input.tenantId, input.companyUuid, liabilityAccounts, dateRange, deps.ledgerRepository),
    aggregateAccountBalances(input.tenantId, input.companyUuid, equityAccounts, dateRange, deps.ledgerRepository),
  ]);

  // BAL-002: Current Year Earnings — the covering, not-yet-closed Financial
  // Year's Net Profit from its own start date through `asOfDate`. Zero if no
  // Financial Year covers `asOfDate` at all, or if the covering year is
  // already Closed (its Net Profit has already been transferred to Retained
  // Earnings by Financial Closing, so it must not be counted twice here).
  const financialYears = await deps.repository.listFinancialYears(input.tenantId, input.companyUuid);
  const coveringYear = financialYears.find(
    (year) => year.startDate.getTime() <= scope.asOfDate.getTime() && scope.asOfDate.getTime() <= year.endDate.getTime(),
  );
  let currentYearEarnings = ZERO;
  if (coveringYear && coveringYear.status !== FinancialYearStatus.Closed) {
    const profitAndLoss = await getProfitAndLoss(
      { tenantId: input.tenantId, companyUuid: input.companyUuid, dateFrom: coveringYear.startDate, dateTo: scope.asOfDate },
      { repository: deps.repository, ledgerRepository: deps.ledgerRepository },
    );
    currentYearEarnings = profitAndLoss.netProfit;
  }

  const assetsTotal = sumBalances(assetBalances);
  const liabilitiesTotal = sumBalances(liabilityBalances);
  const equityTotal = sumBalances(equityBalances).add(currentYearEarnings);

  return {
    asOfDate: scope.asOfDate,
    isProvisional: scope.isProvisional,
    assets: { groups: groupBalancesByAccountGroup(accountGroups, assetBalances), total: assetsTotal },
    liabilities: { groups: groupBalancesByAccountGroup(accountGroups, liabilityBalances), total: liabilitiesTotal },
    equity: { groups: groupBalancesByAccountGroup(accountGroups, equityBalances), total: equityTotal },
    currentYearEarnings,
    // BAL-001: Assets = Liabilities + Equity.
    isBalanced: assetsTotal.equals(liabilitiesTotal.add(equityTotal)),
  };
}
