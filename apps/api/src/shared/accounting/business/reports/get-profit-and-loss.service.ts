// Business layer — Profit & Loss (00_BUSINESS_RULES.md Ch.25). PNL-001:
// Revenue and Expense Accounts only — Asset/Liability/Equity never appear.
// PNL-002: Net Profit/Loss for a period equals total Revenue minus total
// Expense for that SAME period, computed strictly from Ledger entries dated
// within it — a range-scoped aggregation (`[periodStart, periodEnd]`), not
// the cumulative-since-inception balance Trial Balance/Balance Sheet use.
// Composes the shared engine only (`resolvePeriodScope`,
// `filterAccountsByType`, `aggregateAccountBalances`,
// `groupBalancesByAccountGroup`). Revenue/Expense sections are returned in
// full (grouped by Account Group), not cursor-paginated like Trial
// Balance's flat row list — bounded by definition to two AccountTypes, and
// already organized by grouping, so a "page 2 of expenses" concept adds
// complexity no real report needs (a deliberate scope decision, not an
// oversight).
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";
import { ILedgerRepository } from "../../domain/interfaces/ledger-repository.interface";
import { AccountType } from "../../domain/enums/account-type.enum";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";
import { resolvePeriodScope } from "./resolve-report-scope.service";
import { aggregateAccountBalances, sumBalances } from "./aggregate-account-balances.service";
import { filterAccountsByType } from "./filter-accounts-by-type";
import { groupBalancesByAccountGroup } from "./group-balances-by-account-group.service";
import { GroupedBalanceNode } from "./reporting-types";

export interface GetProfitAndLossInput {
  tenantId: bigint;
  companyUuid: string;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface GetProfitAndLossDeps {
  repository: IAccountingRepository;
  ledgerRepository: ILedgerRepository;
}

export interface ProfitAndLossSection {
  groups: GroupedBalanceNode[];
  total: DecimalValue;
}

export interface ProfitAndLossResult {
  periodStart: Date;
  periodEnd: Date;
  isProvisional: boolean;
  revenue: ProfitAndLossSection;
  expenses: ProfitAndLossSection;
  netProfit: DecimalValue;
}

export async function getProfitAndLoss(input: GetProfitAndLossInput, deps: GetProfitAndLossDeps): Promise<ProfitAndLossResult> {
  const scope = await resolvePeriodScope(
    {
      tenantId: input.tenantId,
      fiscalPeriodUuid: input.fiscalPeriodUuid,
      financialYearUuid: input.financialYearUuid,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    },
    deps.repository,
  );

  const [accounts, accountGroups] = await Promise.all([
    deps.repository.listAccounts(input.tenantId, input.companyUuid),
    deps.repository.listAccountGroups(input.tenantId, input.companyUuid),
  ]);

  const revenueAccounts = filterAccountsByType(accounts, [AccountType.Revenue]);
  const expenseAccounts = filterAccountsByType(accounts, [AccountType.Expense]);

  const dateRange = { dateFrom: scope.periodStart, dateTo: scope.periodEnd };
  const [revenueBalances, expenseBalances] = await Promise.all([
    aggregateAccountBalances(input.tenantId, input.companyUuid, revenueAccounts, dateRange, deps.ledgerRepository),
    aggregateAccountBalances(input.tenantId, input.companyUuid, expenseAccounts, dateRange, deps.ledgerRepository),
  ]);

  const revenueGroups = groupBalancesByAccountGroup(accountGroups, revenueBalances);
  const expenseGroups = groupBalancesByAccountGroup(accountGroups, expenseBalances);
  const revenueTotal = sumBalances(revenueBalances);
  const expenseTotal = sumBalances(expenseBalances);

  return {
    periodStart: scope.periodStart,
    periodEnd: scope.periodEnd,
    isProvisional: scope.isProvisional,
    revenue: { groups: revenueGroups, total: revenueTotal },
    expenses: { groups: expenseGroups, total: expenseTotal },
    // PNL-002: Net Profit/Loss = Total Revenue - Total Expenses.
    netProfit: revenueTotal.subtract(expenseTotal),
  };
}
