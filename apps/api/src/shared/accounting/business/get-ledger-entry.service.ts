// Business layer — resolves a single Ledger Entry by its external `uuid`
// together with the originating Journal Entry it was posted from
// (00_BUSINESS_RULES.md Ch.19.11's mandatory drill-down: "a Company
// Administrator can drill into any Ledger entry to see the originating
// Journal Entry... that created it"; Ch.82.7 OPR-002 makes such drill-down
// mandatory for any Operational Report generally, not Ledger-specific).
import { ILedgerRepository } from "../domain/interfaces/ledger-repository.interface";
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { LedgerEntry } from "../domain/entities/ledger-entry.entity";
import { JournalEntry } from "../domain/aggregates/journal-entry.aggregate";
import { LedgerEntryNotFoundError } from "../domain/errors/accounting.errors";

export interface GetLedgerEntryInput {
  tenantId: bigint;
  ledgerEntryUuid: string;
}

export interface GetLedgerEntryDeps {
  ledgerRepository: ILedgerRepository;
  journalEntryRepository: IJournalEntryRepository;
}

export interface LedgerEntryDrillDown {
  ledgerEntry: LedgerEntry;
  journalEntry: JournalEntry;
}

export async function getLedgerEntry(input: GetLedgerEntryInput, deps: GetLedgerEntryDeps): Promise<LedgerEntryDrillDown> {
  const ledgerEntry = await deps.ledgerRepository.findLedgerEntryByUuid(input.tenantId, input.ledgerEntryUuid);
  if (!ledgerEntry) {
    throw new LedgerEntryNotFoundError(input.ledgerEntryUuid);
  }

  // Ch.19.10's one-to-one "derived from" cardinality (LDG-001) guarantees
  // exactly one Journal Entry owns `ledgerEntry.journalEntryLineId` — a
  // `null` result here would itself be the Ch.19.7 LDG-003 "system
  // integrity failure" class of bug, not a normal not-found case. Surfaced
  // via the same `LedgerEntryNotFoundError` rather than inventing a new
  // error type for a condition that should be structurally impossible.
  const journalEntry = await deps.journalEntryRepository.findJournalEntryByLineId(input.tenantId, ledgerEntry.journalEntryLineId);
  if (!journalEntry) {
    throw new LedgerEntryNotFoundError(input.ledgerEntryUuid);
  }

  return { ledgerEntry, journalEntry };
}
