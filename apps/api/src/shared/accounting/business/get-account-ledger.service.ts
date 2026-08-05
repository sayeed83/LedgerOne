// Business layer — the General Ledger read model's core use case: an
// Account's Ledger (00_BUSINESS_RULES.md Ch.19.1 — "the complete,
// chronological record of all posted transactions affecting a specific
// account... showing every debit and credit and the running balance over
// time"). Reads ONLY `LedgerEntry` rows already written by
// `post-journal-entry.service.ts` (LDG-001) — this file introduces no new
// persisted state and no new Aggregate, per the frozen architecture
// decision that General Ledger is a read model over the existing
// `LedgerEntry` Aggregate, never a table or Aggregate of its own.
//
// Per Ch.19.1, a Ledger is inherently a PER-ACCOUNT concept — there is no
// handbook text describing a cross-account, commingled raw entry feed (that
// is Trial Balance, Ch.24, explicitly out of scope this milestone, and
// itself just a per-account aggregation, not a raw feed). `accountUuid` is
// therefore always required here, whether it arrives via a path param
// (`GET /ledger/accounts/:accountUuid`) or a query param (`GET /ledger`) —
// both Presentation routes call this exact same use case.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { ILedgerRepository, LedgerEntryPosition } from "../domain/interfaces/ledger-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { AccountNotFoundError, InvalidLedgerDateRangeError } from "../domain/errors/accounting.errors";
import { decodeLedgerCursor, encodeLedgerCursor } from "./ledger-cursor";
import { calculateRunningBalance, netBalance, LedgerEntryWithBalance } from "./calculate-running-balance.service";

const DEFAULT_LIMIT = 25; // 07_REST_API_STANDARDS.md PAG-004
const MAX_LIMIT = 100; // 07_REST_API_STANDARDS.md PAG-004

export interface GetAccountLedgerInput {
  tenantId: bigint;
  accountUuid: string;
  companyUuid?: string;
  dateFrom?: Date;
  dateTo?: Date;
  cursor?: string;
  limit?: number;
}

export interface GetAccountLedgerDeps {
  repository: IAccountingRepository;
  ledgerRepository: ILedgerRepository;
}

export interface AccountLedgerResult {
  account: Account;
  openingBalance: DecimalValue;
  closingBalance: DecimalValue;
  entries: LedgerEntryWithBalance[];
  pagination: { limit: number; nextCursor: string | null; hasMore: boolean };
}

export async function getAccountLedger(input: GetAccountLedgerInput, deps: GetAccountLedgerDeps): Promise<AccountLedgerResult> {
  const account = await deps.repository.findAccountByUuid(input.tenantId, input.accountUuid);
  if (!account) {
    throw new AccountNotFoundError(input.accountUuid);
  }

  if (input.dateFrom && input.dateTo && input.dateFrom.getTime() > input.dateTo.getTime()) {
    throw new InvalidLedgerDateRangeError(input.dateFrom, input.dateTo);
  }

  const limit = clampLimit(input.limit);
  const cursor = input.cursor ? decodeLedgerCursor(input.cursor) : undefined;
  const companyUuid = input.companyUuid ?? account.companyUuid;

  // LDG-003's "running balance... sum of all entries to date" is always
  // computed relative to wherever the CURRENT page actually starts: the
  // decoded cursor when resuming a later page, else `dateFrom` when this is
  // an explicitly date-bounded first page. An unbounded first page (neither
  // cursor nor dateFrom) starts at account inception, where the opening
  // balance is zero BY DEFINITION — `sumLedgerEntriesBefore` is deliberately
  // NOT called in that case: its "omit position, sum the entire history"
  // contract answers a different question ("balance as of now", the future
  // Trial Balance's own need) than "balance immediately before this page's
  // first row" (zero, when this page's first row IS the account's very
  // first entry). Calling it unconditionally here previously double-counted
  // every entry on an unbounded first page — the opening sum already
  // included every row the page itself was about to walk forward from. This
  // keeps every page self-sufficient and correct in isolation, never
  // dependent on a client re-supplying a prior page's own totals.
  const openingBoundary: LedgerEntryPosition | undefined = cursor ?? (input.dateFrom ? { entryDate: input.dateFrom } : undefined);
  const openingBalance = openingBoundary
    ? await sumToBalance(deps, input.tenantId, account, companyUuid, openingBoundary)
    : DecimalValue.create("0");

  const page = await deps.ledgerRepository.listLedgerEntries(input.tenantId, {
    accountId: account.id,
    companyUuid,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    cursor,
    limit,
  });

  const { entries, closingBalance } = calculateRunningBalance(account.accountType, openingBalance, page.entries);

  const lastEntry = page.entries[page.entries.length - 1];
  const nextCursor = page.hasMore && lastEntry ? encodeLedgerCursor({ entryDate: lastEntry.entryDate, uuid: lastEntry.uuid }) : null;

  return {
    account,
    openingBalance,
    closingBalance,
    entries,
    pagination: { limit, nextCursor, hasMore: page.hasMore },
  };
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(limit, MAX_LIMIT);
}

async function sumToBalance(
  deps: GetAccountLedgerDeps,
  tenantId: bigint,
  account: Account,
  companyUuid: string,
  position: LedgerEntryPosition,
): Promise<DecimalValue> {
  const sum = await deps.ledgerRepository.sumLedgerEntriesBefore(tenantId, account.id, companyUuid, position);
  return netBalance(account.accountType, DecimalValue.create(sum.totalDebit), DecimalValue.create(sum.totalCredit));
}
