// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2. Dedicated to the LedgerEntry Aggregate Root ONLY — a
// SEPARATE interface from both `IAccountingRepository` and
// `IJournalEntryRepository`, per the frozen architecture decision (each
// Aggregate Root gets its own Repository interface; LedgerEntry and
// JournalEntry are separate Aggregates, 03_ARCHITECTURE.md Ch.7.6.1).
//
// Append-only semantics (00_BUSINESS_RULES.md Ch.19.7 LDG-002 — "immutable
// once created... never edited or deleted"): this interface exposes NO
// update or remove method of any kind, stronger than every other Repository
// interface in this module. `appendLedgerEntry` (not `createLedgerEntry`)
// is named to make that one-way semantics explicit at the call site.
//
// Ledger Entry is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
// method takes `tenantId` explicitly and re-asserts it in its own query
// (MT-002). This Repository does NOT coordinate with
// `IJournalEntryRepository` in any way (no method here calls into Journal
// Entry persistence, and vice versa) — that coordination (LDG-001: a Ledger
// Entry is created only from a Posted Journal Entry line) is entirely a
// Business-layer concern (03_ARCHITECTURE.md Ch.7.6.1 — two Aggregates, two
// separate saves, coordinated one level up).
import { LedgerEntry, CreateLedgerEntryProps } from "../entities/ledger-entry.entity";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3).
 * Structurally identical to `IAccountingRepository`'s/
 * `IJournalEntryRepository`'s own `RepositoryTransaction` (all are
 * `unknown`) — a separate type alias per interface, not a shared import,
 * keeping this interface fully independent per the frozen "no shared/
 * extended repository" decision.
 */
export type RepositoryTransaction = unknown;

/**
 * A single point in the Ledger's canonical chronological order (`entryDate`
 * ascending, `uuid` ascending as the stable tie-breaker for same-`entryDate`
 * rows — e.g. every line of one multi-line Journal Entry posts with an
 * identical `entryDate`; `uuid` is globally unique, 06_DATABASE_STANDARDS.md
 * PK-002, so `(entryDate, uuid)` is a total order that never skips or
 * duplicates a row across pages). Used two ways: as a keyset pagination
 * cursor (`uuid` always present — the exact row to page after) and as the
 * "sum everything before this point" boundary for opening-balance
 * calculation (`uuid` omitted when the boundary is a plain `dateFrom`, not a
 * specific row — see `sumLedgerEntriesBefore`).
 */
export interface LedgerEntryPosition {
  entryDate: Date;
  uuid?: string;
}

/** Filter/pagination input for `listLedgerEntries` (00_BUSINESS_RULES.md Ch.19.8 "filtering"; 07_REST_API_STANDARDS.md PAG-001..005 — mandatory cursor pagination, never OFFSET). All filters are optional except `limit`; omitting `accountId` lists across every Account for the Tenant/Company (00_BUSINESS_RULES.md Ch.19 has no such cross-account concept on its own, but nothing here prevents it — see the General Ledger read model's own Business-layer doc comments for why it is not currently exercised that way). */
export interface ListLedgerEntriesFilter {
  accountId?: bigint;
  companyUuid?: string;
  dateFrom?: Date;
  dateTo?: Date;
  /** Resume after this position (exclusive) — omitted for the first page. */
  cursor?: LedgerEntryPosition;
  /** Already clamped to [1, 100] by the Business layer (07_REST_API_STANDARDS.md PAG-004) — this interface trusts its caller, it does not re-clamp. */
  limit: number;
}

export interface ListLedgerEntriesResult {
  entries: LedgerEntry[];
  /** True if strictly more rows exist beyond this page (07_REST_API_STANDARDS.md PAG-005) — the Business layer encodes the last returned entry's own position into the next opaque cursor when this is true. */
  hasMore: boolean;
}

/** Raw decimal-string totals (never `DecimalValue` — this Domain-owned interface's inputs/outputs otherwise mirror every other Repository method's `.toFixed()`-then-`DecimalValue.create()` mapping convention, done by the caller, not here) for `sumLedgerEntriesBefore`. */
export interface LedgerEntrySumBefore {
  totalDebit: string;
  totalCredit: string;
}

export interface ILedgerRepository {
  /** Appends a new, immutable Ledger Entry row (LDG-001 — created only from a Posted Journal Entry line; that precondition is asserted by the Business layer BEFORE calling this method, not by it). Throws `DuplicateLedgerEntryForJournalEntryLineError` if a Ledger Entry already exists for `props.journalEntryLineId` (Ch.19.10's one-to-one cardinality). */
  appendLedgerEntry(tenantId: bigint, props: CreateLedgerEntryProps, tx?: RepositoryTransaction): Promise<LedgerEntry>;
  findLedgerEntryByUuid(tenantId: bigint, uuid: string): Promise<LedgerEntry | null>;
  /** Looked up by the Journal Entry Line's internal `id` — the natural one-to-one key (Ch.19.10 "derived from"), never the `uuid`. */
  findLedgerEntryByJournalEntryLineId(tenantId: bigint, journalEntryLineId: bigint): Promise<LedgerEntry | null>;
  /**
   * The General Ledger read model's core query (00_BUSINESS_RULES.md
   * Ch.19.1/19.6) — cursor-paginated, ordered `entryDate` ascending then
   * `uuid` ascending (see `LedgerEntryPosition`'s own doc comment for why).
   * Computing the running balance (LDG-003) from the returned rows remains a
   * Business-layer concern, unchanged from before this milestone — this
   * method still only shapes and paginates the query, it does not sum
   * anything. Signature changed from the prior `(tenantId, accountId?)` form
   * to this filter-object form as part of this milestone — safe because no
   * real caller existed yet (grep-confirmed: only this file's own type
   * declaration and a `jest.fn()` test-fixture stub referenced the old
   * signature), so this is an additive capability change, not a breaking
   * redesign of a used contract.
   */
  listLedgerEntries(tenantId: bigint, filter: ListLedgerEntriesFilter): Promise<ListLedgerEntriesResult>;
  /**
   * Aggregates total debit/credit for one Account "before" a given
   * `position` (omitted sums the Account's entire history) — the Ledger's
   * own "opening balance for this page" primitive (Ch.19.7 LDG-003 "sum of
   * all its Ledger entries to date"), and, per this milestone's own
   * architecture review, the same per-account SUM aggregation Trial Balance
   * (Ch.24.10 — "a derived report over Ledger data") will need too, built
   * once here rather than reimplemented per report. Signing the two raw
   * totals into one balance figure via the Account's normal-balance
   * convention (Ch.16 DBL-003) is a Business-layer concern
   * (`calculate-running-balance.service.ts`), not this method's.
   *
   * "Before" is DELIBERATELY NOT symmetric with `listLedgerEntries`' cursor
   * predicate (which is strictly greater-than the cursor row) — the two
   * mean different things by `position`:
   *   - `uuid` omitted (a plain `dateFrom` threshold, no specific row): sums
   *     strictly BEFORE that date — `dateFrom` is the page's own inclusive
   *     lower bound and must not be double-counted into the opening
   *     balance.
   *   - `uuid` present (a pagination cursor — the LAST row already returned
   *     on the PRIOR page): sums UP TO AND INCLUDING that row, since its
   *     own debit/credit already contributed to that prior page's own
   *     closing balance and must be folded forward, not dropped. Getting
   *     this backwards silently drops one row's amount from every
   *     subsequent page's running balance — caught during this milestone's
   *     own live end-to-end verification (multi-page pagination against
   *     real MySQL data), fixed before merge, not a hypothetical concern.
   */
  sumLedgerEntriesBefore(
    tenantId: bigint,
    accountId: bigint,
    companyUuid: string | undefined,
    position?: LedgerEntryPosition,
  ): Promise<LedgerEntrySumBefore>;
}
