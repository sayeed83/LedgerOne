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

export interface ILedgerRepository {
  /** Appends a new, immutable Ledger Entry row (LDG-001 — created only from a Posted Journal Entry line; that precondition is asserted by the Business layer BEFORE calling this method, not by it). Throws `DuplicateLedgerEntryForJournalEntryLineError` if a Ledger Entry already exists for `props.journalEntryLineId` (Ch.19.10's one-to-one cardinality). */
  appendLedgerEntry(tenantId: bigint, props: CreateLedgerEntryProps, tx?: RepositoryTransaction): Promise<LedgerEntry>;
  findLedgerEntryByUuid(tenantId: bigint, uuid: string): Promise<LedgerEntry | null>;
  /** Looked up by the Journal Entry Line's internal `id` — the natural one-to-one key (Ch.19.10 "derived from"), never the `uuid`. */
  findLedgerEntryByJournalEntryLineId(tenantId: bigint, journalEntryLineId: bigint): Promise<LedgerEntry | null>;
  /** Optionally narrowed to a single Account; omitted, returns every Ledger Entry for the Tenant. Ordered by `entryDate` ascending — the chronological per-account history Ch.19.6 describes; computing the running balance (LDG-003) from this ordering is a Business-layer concern. */
  listLedgerEntries(tenantId: bigint, accountId?: bigint): Promise<LedgerEntry[]>;
}
