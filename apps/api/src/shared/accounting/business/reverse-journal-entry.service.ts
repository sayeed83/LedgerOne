// Business layer — reverses a Posted Journal Entry (00_BUSINESS_RULES.md
// Ch.20.7 JRN-003: "Once Posted, a Journal Entry cannot be edited or
// deleted — correction requires a Reversing Entry (a new Journal Entry with
// debits/credits exactly inverted) referencing the original.").
//
// Sequence, per the Domain aggregate's own `markReversed()` doc comment
// ("constructing the reversing entry itself... is a Business-layer concern
// performed BEFORE this transition — this method only marks the original as
// superseded once that reversing entry has itself been posted"):
// 1. Load the original; `markReversed()` structurally guards that it is
//    currently Posted (the only valid `from` state for a reversal) before
//    anything else runs — its returned instance is not persisted here, only
//    used as the transition guard; persisting the original's Reversed
//    status happens in step 4, only after the new entry successfully posts.
// 2. Build the reversing entry's lines by swapping each original line's
//    `debitAmount`/`creditAmount` ("exactly inverted", JRN-003) and create
//    it as a new Draft Journal Entry referencing the original via
//    `reversalOfJournalEntryId`.
// 3. Post the reversing entry through the existing `postJournalEntry` use
//    case (re-run in full: DBL-001/DBL-002/JRN-002/FY-003 all re-validated,
//    Ledger Entries appended) — reused rather than duplicated, since a
//    reversing entry is posted through exactly the same mechanism as any
//    other Journal Entry.
// 4. Only once the reversing entry is successfully Posted, mark the
//    original as Reversed.
//
// The reversing entry's `postingDate` is "now" (`deps.clock.now()`, per
// 05_CODING_STANDARDS.md Ch.20.4's `deps.clock.now()` pattern), not the
// original's posting date — see `domain/interfaces/clock.interface.ts`'s
// doc comment for why: the original's posting date may sit in an
// already-Closed Fiscal Period, which would make the reversal itself
// unpostable without invoking Ch.20.12's Reopen exception.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { ILedgerRepository } from "../domain/interfaces/ledger-repository.interface";
import { ITransactionRunner } from "../domain/interfaces/transaction-runner.interface";
import { IClock } from "../domain/interfaces/clock.interface";
import { JournalEntry, CreateJournalEntryLineProps } from "../domain/aggregates/journal-entry.aggregate";
import { postJournalEntry } from "./post-journal-entry.service";
import { JournalEntryNotFoundError } from "../domain/errors/accounting.errors";

export interface ReverseJournalEntryInput {
  tenantId: bigint;
  journalEntryUuid: string;
  createdBy?: bigint | null;
}

export interface ReverseJournalEntryDeps {
  journalEntryRepository: IJournalEntryRepository;
  ledgerRepository: ILedgerRepository;
  repository: IAccountingRepository;
  transactionRunner: ITransactionRunner;
  clock: IClock;
}

export async function reverseJournalEntry(input: ReverseJournalEntryInput, deps: ReverseJournalEntryDeps): Promise<JournalEntry> {
  const original = await deps.journalEntryRepository.findJournalEntryByUuid(input.tenantId, input.journalEntryUuid);
  if (!original) {
    throw new JournalEntryNotFoundError(input.journalEntryUuid);
  }

  original.markReversed();

  const reversingLines: CreateJournalEntryLineProps[] = original.lines.map((line) => ({
    accountId: line.accountId,
    debitAmount: line.creditAmount,
    creditAmount: line.debitAmount,
    createdBy: input.createdBy ?? null,
  }));

  const reversingEntry = await deps.journalEntryRepository.createJournalEntry(input.tenantId, {
    companyUuid: original.companyUuid,
    postingDate: deps.clock.now(),
    narration: `Reversal of Journal Entry '${original.uuid}'`,
    reversalOfJournalEntryId: original.id,
    lines: reversingLines,
    createdBy: input.createdBy ?? null,
  });

  const postedReversingEntry = await postJournalEntry(
    { tenantId: input.tenantId, journalEntryUuid: reversingEntry.uuid, updatedBy: input.createdBy ?? null },
    deps,
  );

  await deps.journalEntryRepository.markJournalEntryReversed(input.tenantId, original.uuid, input.createdBy ?? null);

  return postedReversingEntry;
}
