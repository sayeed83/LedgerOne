// Domain-owned collaborator interface (03_ARCHITECTURE.md Decision 5.7.2) —
// lets the Business layer open one atomic Prisma transaction spanning
// multiple Repository calls (05_CODING_STANDARDS.md Ch.20.3 — "a use case
// that writes to more than one table must wrap those writes in a single
// Prisma `$transaction`") without importing the Prisma client itself
// (Ch.9.5 — only a module's `repository/` folder may do that).
//
// `PostJournalEntryService` is this module's first use case needing this:
// it writes both `journal_entries` (via `IJournalEntryRepository`) and
// `ledger_entries` (via `ILedgerRepository`) — two separate Aggregate Roots,
// two separate Repository interfaces (03_ARCHITECTURE.md Ch.7.6.1), one
// atomic transaction coordinated here at the Business layer, exactly as the
// frozen architecture requires ("Posting is coordinated by the Business
// layer").
//
// The `tx` handle passed to the callback is intentionally `unknown` — it is
// the same value each Repository interface's own `RepositoryTransaction`
// type already accepts (all three are structurally `unknown`), so it can be
// passed to `IJournalEntryRepository`/`ILedgerRepository`/
// `IAccountingRepository` methods interchangeably without this interface
// depending on any of them.
export interface ITransactionRunner {
  run<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
