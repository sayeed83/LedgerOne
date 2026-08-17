// Business layer — Cash Flow (00_BUSINESS_RULES.md Ch.27), SIMPLIFIED
// INDIRECT METHOD per an explicit, user-confirmed scope decision (see
// engineering plan for this milestone): CFL-002's indirect method starts
// from Net Profit (composed from `get-profit-and-loss.service.ts`, never a
// second calculation) and adjusts for the period's change in every non-cash
// Balance Sheet account, reported as ONE reconciling "Operating Activities"
// figure rather than a genuine Operating/Investing/Financing three-way
// split.
//
// WHY simplified: neither `Account` nor `AccountGroup` carries any field or
// documented naming convention that categorizes an account as Operating,
// Investing, or Financing (00_BUSINESS_RULES.md Ch.17/18 are silent on this)
// — a real, load-bearing gap, not something this milestone may invent
// without fabricating a business rule (CLAUDE.md §13). Flagged as an
// Architectural Risk in this milestone's own report; a genuine three-way
// split needs either a handbook update defining the categorization or a new
// Account Group field, both out of scope for a frozen-architecture epic.
//
// Identifying "Cash and Bank" accounts (Ch.61) is itself a documented
// heuristic — an Asset Account whose Account Group name matches /cash|bank/i
// — since no `isCashAccount` flag exists either (Bank Accounts, Ch.61, has
// no dedicated module/entity yet per `current-phase.md`'s open questions).
//
// Why this reconciles exactly to the actual Cash/Bank balance change
// (CFL-001) despite being "simplified": for any period, the balance-sheet
// identity Assets = Liabilities + Equity holds at both the period start and
// end (BAL-001), so the change in Cash (an Asset) must equal the combined
// change in every OTHER Balance Sheet account, signed by each account's own
// normal-balance direction. Net Profit is added separately because Revenue/
// Expense postings do not touch any Balance Sheet Equity account until
// Financial Closing (Ch.32) transfers them to Retained Earnings — for an
// still-Open period, Net Profit is exactly the piece of the identity not yet
// reflected in Liabilities/Equity's own period change. `netCashFlow` and
// `actualCashChange` are both returned so any drift (e.g. a genuine
// Ledger/Account-data integrity problem) is visible rather than masked.
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";
import { ILedgerRepository } from "../../domain/interfaces/ledger-repository.interface";
import { AccountType } from "../../domain/enums/account-type.enum";
import { Account } from "../../domain/aggregates/account.aggregate";
import { AccountGroup } from "../../domain/entities/account-group.entity";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";
import { resolvePeriodScope } from "./resolve-report-scope.service";
import { aggregateAccountBalances, sumBalances } from "./aggregate-account-balances.service";
import { filterAccountsByType } from "./filter-accounts-by-type";
import { getProfitAndLoss } from "./get-profit-and-loss.service";

export interface GetCashFlowInput {
  tenantId: bigint;
  companyUuid: string;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface GetCashFlowDeps {
  repository: IAccountingRepository;
  ledgerRepository: ILedgerRepository;
}

export interface CashFlowResult {
  periodStart: Date;
  periodEnd: Date;
  isProvisional: boolean;
  netProfit: DecimalValue;
  /** Net period change across every non-cash Balance Sheet account, signed for its effect on cash (CFL-002's indirect-method adjustment). */
  operatingAdjustment: DecimalValue;
  /** `netProfit + operatingAdjustment` — this milestone's single, coarse Operating Activities reconciliation (see file header). */
  netCashFlow: DecimalValue;
  /** The Cash/Bank accounts' own actual period balance change, for comparison against `netCashFlow` (CFL-001). */
  actualCashChange: DecimalValue;
  /** True when `netCashFlow` equals `actualCashChange` — expected to always be true given the balance-sheet identity (see file header); false would indicate a genuine data-integrity problem to investigate, not a report defect. */
  reconciles: boolean;
}

const ZERO = DecimalValue.create("0");
const CASH_OR_BANK_PATTERN = /cash|bank/i;

export async function getCashFlow(input: GetCashFlowInput, deps: GetCashFlowDeps): Promise<CashFlowResult> {
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

  const profitAndLoss = await getProfitAndLoss(
    { tenantId: input.tenantId, companyUuid: input.companyUuid, dateFrom: scope.periodStart, dateTo: scope.periodEnd },
    { repository: deps.repository, ledgerRepository: deps.ledgerRepository },
  );

  const [accounts, accountGroups] = await Promise.all([
    deps.repository.listAccounts(input.tenantId, input.companyUuid),
    deps.repository.listAccountGroups(input.tenantId, input.companyUuid),
  ]);
  const accountGroupsById = new Map<bigint, AccountGroup>(accountGroups.map((group) => [group.id, group]));
  const isCashOrBankAccount = (account: Account): boolean => {
    if (account.accountType !== AccountType.Asset) {
      return false;
    }
    const accountGroup = accountGroupsById.get(account.accountGroupId);
    return accountGroup !== undefined && CASH_OR_BANK_PATTERN.test(accountGroup.name);
  };

  const balanceSheetAccounts = filterAccountsByType(accounts, [AccountType.Asset, AccountType.Liability, AccountType.Equity]);
  const cashAccounts = balanceSheetAccounts.filter(isCashOrBankAccount);
  const nonCashAccounts = balanceSheetAccounts.filter((account) => !isCashOrBankAccount(account));

  const [openingNonCash, closingNonCash, openingCash, closingCash] = await Promise.all([
    aggregateAccountBalances(input.tenantId, input.companyUuid, nonCashAccounts, { dateTo: scope.periodStart }, deps.ledgerRepository),
    aggregateAccountBalances(input.tenantId, input.companyUuid, nonCashAccounts, { dateTo: scope.periodEnd }, deps.ledgerRepository),
    aggregateAccountBalances(input.tenantId, input.companyUuid, cashAccounts, { dateTo: scope.periodStart }, deps.ledgerRepository),
    aggregateAccountBalances(input.tenantId, input.companyUuid, cashAccounts, { dateTo: scope.periodEnd }, deps.ledgerRepository),
  ]);

  const openingByAccountId = new Map(openingNonCash.map((balance) => [balance.account.id, balance.balance]));
  // A debit-normal (Asset) account's balance INCREASE consumes cash (subtract
  // its change); a credit-normal (Liability/Equity) account's balance
  // INCREASE supplies cash (add its change) — the indirect method's standard
  // working-capital adjustment direction.
  const operatingAdjustment = closingNonCash.reduce((total, closing) => {
    const opening = openingByAccountId.get(closing.account.id) ?? ZERO;
    const change = closing.balance.subtract(opening);
    return closing.account.accountType === AccountType.Asset ? total.subtract(change) : total.add(change);
  }, ZERO);

  const netCashFlow = profitAndLoss.netProfit.add(operatingAdjustment);
  const actualCashChange = sumBalances(closingCash).subtract(sumBalances(openingCash));

  return {
    periodStart: scope.periodStart,
    periodEnd: scope.periodEnd,
    isProvisional: scope.isProvisional,
    netProfit: profitAndLoss.netProfit,
    operatingAdjustment,
    netCashFlow,
    actualCashChange,
    reconciles: netCashFlow.equals(actualCashChange),
  };
}
