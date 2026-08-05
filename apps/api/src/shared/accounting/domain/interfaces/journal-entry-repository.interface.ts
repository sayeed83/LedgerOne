// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no balance validation (DBL-001/002), no Fiscal-Period-open
// check (JRN-002), no approval-threshold routing (JRN-004), and no
// coordination with Ledger persistence (LDG-001) — all Business-layer
// concerns. Find methods return `null`, never throw, when nothing matches
// (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
//
// Dedicated to the JournalEntry Aggregate ONLY (JournalEntry +
// JournalEntryLine, one Aggregate per 03_ARCHITECTURE.md Ch.7.3.3) — a
// SEPARATE interface from the existing `IAccountingRepository`, per the
// frozen architecture decision that each Aggregate Root gets its own
// Repository interface (Ch.7.3.3's stated rule, Ch.7.3.6's literal
// `IJournalEntryRepository` diagram name). Never extended to also cover
// Ledger Entry — see `ILedgerRepository`.
//
// Journal Entry is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
// method takes `tenantId` explicitly and re-asserts it in its own query,
// never relying on a previously-resolved row's identity (MT-002, Ch.6.4's
// worked example). `companyUuid` is a cross-module reference (FK-002) to
// Organization's `companies.uuid` — looked up/filtered by `uuid`, never a
// numeric id from another module's schema.
import { JournalEntry, CreateJournalEntryProps, UpdateJournalEntryProps, JournalEntryLine, CreateJournalEntryLineProps } from "../aggregates/journal-entry.aggregate";
import { JournalEntryStatus } from "../enums/journal-entry-status.enum";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 * Structurally identical to `IAccountingRepository`'s own
 * `RepositoryTransaction` (both are `unknown`) — a separate type alias per
 * interface, not a shared import, so this interface stays fully independent
 * of `IAccountingRepository` per the frozen "no shared/extended repository"
 * decision.
 */
export type RepositoryTransaction = unknown;

export interface IJournalEntryRepository {
  /** Creates a Journal Entry together with its lines in one write (the Aggregate is persisted as a whole, Ch.7.3.3). Line-level DBL-001/002 balance checking is a Business-layer concern performed BEFORE calling this method, not by it. */
  createJournalEntry(tenantId: bigint, props: CreateJournalEntryProps, tx?: RepositoryTransaction): Promise<JournalEntry>;
  /** Loads the Aggregate Root together with its lines (Ch.7.3.3 — they are always loaded/persisted together, never a line independent of its parent). */
  findJournalEntryByUuid(tenantId: bigint, uuid: string): Promise<JournalEntry | null>;
  /** Optionally narrowed to a single Company (FK-002 `companyUuid`) and/or a single lifecycle status; any/all may be omitted, returning every Journal Entry for the Tenant. Each entry is returned with its lines, mirroring `findJournalEntryByUuid`. Ordered by `postingDate` descending. */
  listJournalEntries(tenantId: bigint, companyUuid?: string, status?: JournalEntryStatus): Promise<JournalEntry[]>;
  /** Revises `postingDate`/`narration` on an existing Journal Entry row. Restricting this to the Draft state (JRN-003's posted-immutability) is a Business-layer concern, not enforced here. */
  updateJournalEntry(
    tenantId: bigint,
    uuid: string,
    props: UpdateJournalEntryProps,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntry>;
  /** Sets status to PendingApproval (00_BUSINESS_RULES.md Ch.20.5) — a raw persistence transition; deciding WHETHER submission is required (JRN-004's threshold) is a Business-layer concern (this milestone is Repository-only). */
  submitJournalEntryForApproval(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<JournalEntry>;
  /** Sets status to Posted (Ch.20.5) — a raw persistence transition; DBL-001/002 balance validation, JRN-002's Fiscal-Period-open check, and the corresponding Ledger Entry writes (LDG-001, via `ILedgerRepository`, coordinated by the Business layer) all happen BEFORE this call, not as part of it. */
  postJournalEntry(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<JournalEntry>;
  /** Sets status to Draft (Ch.13.5/Ch.20.5 — Rejected, returned for correction) — a raw persistence transition; validating the `from` state and who may reject (APR-002/003) are Business-layer concerns. */
  rejectJournalEntry(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<JournalEntry>;
  /** Sets status to Reversed (Ch.20.5/JRN-003) — a raw persistence transition; constructing and posting the actual reversing Journal Entry (a separate `createJournalEntry` + `postJournalEntry` call with inverted debit/credit amounts) is a Business-layer concern performed before this call. */
  markJournalEntryReversed(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<JournalEntry>;

  /** Adds a line to an already-created Journal Entry (Ch.7.3.3's `addLine()` — persistence only; the balance invariant it exists to eventually satisfy is asserted by the Business layer, not here). `journalEntryId` is the parent's internal `id`, resolved by the caller via `findJournalEntryByUuid` first. */
  addJournalEntryLine(
    tenantId: bigint,
    journalEntryId: bigint,
    props: CreateJournalEntryLineProps,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntryLine>;
  /** Removes (soft-deletes) a line from a Journal Entry (Ch.7.3.3's `removeLine()` — persistence only). Restricting this to the Draft state is a Business-layer concern. */
  removeJournalEntryLine(tenantId: bigint, lineUuid: string, tx?: RepositoryTransaction): Promise<void>;
}
