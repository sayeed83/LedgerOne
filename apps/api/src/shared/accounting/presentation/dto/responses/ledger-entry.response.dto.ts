import { z } from "zod";

// Never the `LedgerEntry` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3). Internal `id`/`tenantId`/`accountId`/`journalEntryLineId`/
// `createdBy` are never serialized (06_DATABASE_STANDARDS.md PK-003) — a
// row's `uuid` alone is sufficient for a client to drill down via
// `GET /ledger/entries/:ledgerEntryUuid`, which resolves the full Journal
// Entry linkage; the row-level shape here deliberately stays flat/lean so a
// page of entries never pays a per-row join cost (see this milestone's own
// "Drill-down Strategy" note). `runningBalance` is computed by
// `calculate-running-balance.service.ts` at read time (LDG-003) and is
// never a field on the Domain entity itself.
export const ledgerEntryResponseSchema = z.object({
  uuid: z.string().uuid(),
  entryDate: z.date(),
  debitAmount: z.string(),
  creditAmount: z.string(),
  runningBalance: z.string(),
});

export type LedgerEntryResponse = z.infer<typeof ledgerEntryResponseSchema>;

/** Structural rather than importing the Domain `LedgerEntry`/`DecimalValue` types (Presentation must not import domain/, Ch.9.3). */
interface LedgerEntryWithBalanceLike {
  entry: {
    uuid: string;
    entryDate: Date;
    debitAmount: { toString(): string };
    creditAmount: { toString(): string };
  };
  runningBalance: { toString(): string };
}

export function toLedgerEntryResponse(entryWithBalance: LedgerEntryWithBalanceLike): LedgerEntryResponse {
  return {
    uuid: entryWithBalance.entry.uuid,
    entryDate: entryWithBalance.entry.entryDate,
    debitAmount: entryWithBalance.entry.debitAmount.toString(),
    creditAmount: entryWithBalance.entry.creditAmount.toString(),
    runningBalance: entryWithBalance.runningBalance.toString(),
  };
}
