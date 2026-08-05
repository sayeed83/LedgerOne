import { z } from "zod";
import { JournalEntryStatus } from "../../../business/accounting-types";

// `GET /ledger/entries/:ledgerEntryUuid` response — the Ledger Entry itself
// plus the originating Journal Entry it was posted from (00_BUSINESS_RULES.md
// Ch.19.11's mandatory drill-down). `journalEntry` is deliberately a narrow
// summary (uuid/postingDate/narration/status), not the full
// journal-entry.response.dto.ts shape with all of its lines — a client that
// needs the full Journal Entry (e.g. to see every other line in the same
// transaction) follows `journalEntry.uuid` to
// `GET /accounting/journal-entries/:journalEntryUuid` instead.
//
// `accountUuid` is DELIBERATELY OMITTED here — a genuine, flagged
// architectural limitation carried forward from journal-entry.response.dto.ts's
// own identical omission of each line's `accountId`: `LedgerEntry.accountId`
// is an internal FK (PK-003) and `IAccountingRepository` (frozen, not
// modified this milestone) exposes no by-internal-id Account lookup, only
// `findAccountByUuid`/`findAccountByCode`. See this milestone's own
// "Architectural Risks" for the full reasoning.
export const ledgerEntryDrillDownResponseSchema = z.object({
  uuid: z.string().uuid(),
  entryDate: z.date(),
  debitAmount: z.string(),
  creditAmount: z.string(),
  journalEntry: z.object({
    uuid: z.string().uuid(),
    postingDate: z.date(),
    narration: z.string().nullable(),
    status: z.nativeEnum(JournalEntryStatus),
  }),
});

export type LedgerEntryDrillDownResponse = z.infer<typeof ledgerEntryDrillDownResponseSchema>;

interface LedgerEntryDrillDownLike {
  ledgerEntry: {
    uuid: string;
    entryDate: Date;
    debitAmount: { toString(): string };
    creditAmount: { toString(): string };
  };
  journalEntry: {
    uuid: string;
    postingDate: Date;
    narration: string | null;
    status: string;
  };
}

export function toLedgerEntryDrillDownResponse(drillDown: LedgerEntryDrillDownLike): LedgerEntryDrillDownResponse {
  return {
    uuid: drillDown.ledgerEntry.uuid,
    entryDate: drillDown.ledgerEntry.entryDate,
    debitAmount: drillDown.ledgerEntry.debitAmount.toString(),
    creditAmount: drillDown.ledgerEntry.creditAmount.toString(),
    journalEntry: {
      uuid: drillDown.journalEntry.uuid,
      postingDate: drillDown.journalEntry.postingDate,
      narration: drillDown.journalEntry.narration,
      status: drillDown.journalEntry.status as JournalEntryStatus,
    },
  };
}
