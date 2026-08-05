// Business layer — posts a Journal Entry (00_BUSINESS_RULES.md Ch.20.5:
// Draft -> Posted, or PendingApproval -> Posted). This is the module's
// posting-coordination use case the frozen architecture assigns to the
// Business layer (03_ARCHITECTURE.md Ch.7.6.1 — JournalEntry and LedgerEntry
// are separate Aggregate Roots; a use case spanning both is two separate
// Aggregate saves coordinated one level up, never merged into one
// mega-Aggregate or one Repository).
//
// Sequence:
// 1. Resolve the Journal Entry; the Domain aggregate's `post()` enforces the
//    transition is structurally legal (Draft/PendingApproval only) before
//    anything else runs (05_CODING_STANDARDS.md Ch.15.4).
// 2. `validateJournalEntryPostable` re-checks DBL-001 (balance), DBL-002
//    (minimum lines/distinct accounts), and JRN-002/FY-003 (Fiscal
//    Period/Financial Year open) — all read-only, all before any write.
// 3. Inside ONE `ITransactionRunner.run` (05_CODING_STANDARDS.md Ch.20.3 —
//    "a use case that writes to more than one table must wrap those writes
//    in a single Prisma `$transaction`"): persist the JournalEntry's status
//    transition via `IJournalEntryRepository`, then append one Ledger Entry
//    per line via `ILedgerRepository` (LDG-001 — "a Ledger entry is created
//    only from a Posted Journal Entry line"). Ledger Entries are only ever
//    appended here — never updated, never deleted (LDG-002).
//
// Each line's Account Active/isPostingAccount status is NOT re-validated at
// this step (see validate-journal-entry-postable.service.ts's doc comment
// for why — a genuine, frozen-Repository-interface limitation, not an
// oversight).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { ILedgerRepository } from "../domain/interfaces/ledger-repository.interface";
import { ITransactionRunner } from "../domain/interfaces/transaction-runner.interface";
import { JournalEntry } from "../domain/aggregates/journal-entry.aggregate";
import { validateJournalEntryPostable } from "./validate-journal-entry-postable.service";
import { JournalEntryNotFoundError } from "../domain/errors/accounting.errors";

export interface PostJournalEntryInput {
  tenantId: bigint;
  journalEntryUuid: string;
  updatedBy?: bigint | null;
}

export interface PostJournalEntryDeps {
  journalEntryRepository: IJournalEntryRepository;
  ledgerRepository: ILedgerRepository;
  repository: IAccountingRepository;
  transactionRunner: ITransactionRunner;
}

export async function postJournalEntry(input: PostJournalEntryInput, deps: PostJournalEntryDeps): Promise<JournalEntry> {
  const journalEntry = await deps.journalEntryRepository.findJournalEntryByUuid(input.tenantId, input.journalEntryUuid);
  if (!journalEntry) {
    throw new JournalEntryNotFoundError(input.journalEntryUuid);
  }

  journalEntry.post();
  await validateJournalEntryPostable({ tenantId: input.tenantId, journalEntry }, deps);

  return deps.transactionRunner.run(async (tx) => {
    const posted = await deps.journalEntryRepository.postJournalEntry(
      input.tenantId,
      journalEntry.uuid,
      input.updatedBy ?? null,
      tx,
    );

    for (const line of journalEntry.lines) {
      await deps.ledgerRepository.appendLedgerEntry(
        input.tenantId,
        {
          companyUuid: journalEntry.companyUuid,
          accountId: line.accountId,
          journalEntryLineId: line.id,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          entryDate: journalEntry.postingDate,
          createdBy: input.updatedBy ?? null,
        },
        tx,
      );
    }

    return posted;
  });
}
