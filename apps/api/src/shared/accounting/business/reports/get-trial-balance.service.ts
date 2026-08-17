// Business layer — Trial Balance (00_BUSINESS_RULES.md Ch.24): a snapshot of
// every Account's balance as of a report date. TRB-001: total debit must
// exactly equal total credit (a direct consequence of the double-entry
// invariant, Ch.16) — surfaced here as the `isBalanced` data field, never a
// thrown error (this is a read-only report; an out-of-balance Trial Balance
// is a CRITICAL integrity finding for the caller to act on, Ch.24.12, not a
// blocked request). TRB-002: includes every Account with activity by
// default; `includeZeroActivity` additionally includes Accounts with no
// Ledger activity at all, for completeness review. Composes the shared
// engine only (`resolvePointInTimeScope`, `aggregateAccountBalances`,
// `paginateReportRows`) — no aggregation logic of its own.
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";
import { ILedgerRepository } from "../../domain/interfaces/ledger-repository.interface";
import { IClock } from "../../domain/interfaces/clock.interface";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";
import { resolvePointInTimeScope } from "./resolve-report-scope.service";
import { aggregateAccountBalances } from "./aggregate-account-balances.service";
import { clampReportLimit, paginateReportRows } from "./paginate-report-rows";
import { AccountBalance } from "./reporting-types";

export interface GetTrialBalanceInput {
  tenantId: bigint;
  companyUuid: string;
  asOfDate?: Date;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
  includeZeroActivity?: boolean;
  cursor?: string;
  limit?: number;
}

export interface GetTrialBalanceDeps {
  repository: IAccountingRepository;
  ledgerRepository: ILedgerRepository;
  clock: IClock;
}

export interface TrialBalanceResult {
  asOfDate: Date;
  isProvisional: boolean;
  rows: AccountBalance[];
  totalDebit: DecimalValue;
  totalCredit: DecimalValue;
  isBalanced: boolean;
  pagination: { limit: number; nextCursor: string | null; hasMore: boolean };
}

const ZERO = DecimalValue.create("0");

export async function getTrialBalance(input: GetTrialBalanceInput, deps: GetTrialBalanceDeps): Promise<TrialBalanceResult> {
  const scope = await resolvePointInTimeScope(
    { tenantId: input.tenantId, asOfDate: input.asOfDate, fiscalPeriodUuid: input.fiscalPeriodUuid, financialYearUuid: input.financialYearUuid },
    deps.repository,
    deps.clock,
  );

  const accounts = await deps.repository.listAccounts(input.tenantId, input.companyUuid);
  const balances = await aggregateAccountBalances(input.tenantId, input.companyUuid, accounts, { dateTo: scope.asOfDate }, deps.ledgerRepository);

  const rows = input.includeZeroActivity ? balances : balances.filter((row) => !row.totalDebit.equals(ZERO) || !row.totalCredit.equals(ZERO));

  // TRB-001: computed over the FULL filtered row set, not just the returned
  // page — pagination narrows what is displayed, never what is totaled.
  const totalDebit = rows.reduce((sum, row) => sum.add(row.totalDebit), ZERO);
  const totalCredit = rows.reduce((sum, row) => sum.add(row.totalCredit), ZERO);

  const limit = clampReportLimit(input.limit);
  const { page, nextCursor, hasMore } = paginateReportRows(rows, (row) => row.account.code, input.cursor, limit);

  return {
    asOfDate: scope.asOfDate,
    isProvisional: scope.isProvisional,
    rows: page,
    totalDebit,
    totalCredit,
    isBalanced: totalDebit.equals(totalCredit),
    pagination: { limit, nextCursor, hasMore },
  };
}
