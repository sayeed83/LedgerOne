// Composition root (05_CODING_STANDARDS.md Ch.10.4) — the one place that
// wires concrete implementations to the interfaces every use-case service
// depends on. No DI container (Ch.10.5); plain manual construction. Not
// used by unit tests, which build their own fake `deps` (Ch.10.6) — this
// file is for the future Presentation layer to import.
//
// `journalEntryRepository`/`ledgerRepository` are wired as separate
// dependencies from `repository` (the existing `IAccountingRepository`),
// per the frozen architecture decision that JournalEntry and LedgerEntry
// are separate Aggregate Roots with their own Repository interfaces — no
// Business-layer service exists yet to consume them (that is explicitly a
// later milestone; this wiring is Repository-layer "composition support"
// only).
import { PrismaAccountingRepository } from "../repository/accounting.repository";
import { PrismaJournalEntryRepository } from "../repository/journal-entry.repository";
import { PrismaLedgerRepository } from "../repository/ledger.repository";
import { PrismaTransactionRunner } from "../repository/prisma-transaction-runner";
import { SystemClock } from "./system-clock";

export function createAccountingDependencies() {
  return {
    repository: new PrismaAccountingRepository(),
    journalEntryRepository: new PrismaJournalEntryRepository(),
    ledgerRepository: new PrismaLedgerRepository(),
    transactionRunner: new PrismaTransactionRunner(),
    clock: new SystemClock(),
  };
}

/** The shape every Presentation-layer controller in this module depends on — real deps here, fakes in tests (Ch.10.6). */
export type AccountingDependencies = ReturnType<typeof createAccountingDependencies>;
