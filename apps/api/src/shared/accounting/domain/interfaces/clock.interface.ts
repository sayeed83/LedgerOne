// Domain-owned collaborator interface (03_ARCHITECTURE.md Decision 5.7.2) —
// lets Business-layer logic ask "what time is it" without depending on the
// system clock directly, per 05_CODING_STANDARDS.md Ch.20.4's
// `deps.clock.now()` pattern. Kept trivial on purpose so tests can supply a
// fixed instant. Mirrors Authentication's own `IClock`
// (domain/interfaces/clock.interface.ts) exactly — not imported from there,
// since cross-module imports are restricted to a module's published
// contract only (04_FOLDER_STRUCTURE.md §19.3/Ch.6.7), and Authentication's
// Domain interface is not part of its published surface.
//
// Used by `reverseJournalEntry` (business/reverse-journal-entry.service.ts)
// to stamp the reversing Journal Entry's `postingDate` with "now" — Ch.20.7
// JRN-003 requires a Reversing Entry but does not specify its posting date;
// using "now" (rather than the original entry's posting date, which may sit
// in an already-Closed Fiscal Period) is the only choice that keeps a
// reversal postable without invoking Ch.20.12's Reopen exception, a
// documented inline decision (06_DATABASE_STANDARDS.md §1.7 pattern).
export interface IClock {
  now(): Date;
}
