import { z } from "zod";
import { JournalEntryStatus } from "../../../business/accounting-types";

// Never the `JournalEntry` Domain Aggregate itself (05_CODING_STANDARDS.md
// Ch.16.3). Internal `id`/`tenantId`/`createdBy`/`updatedBy`/`deletedAt` are
// never serialized (06_DATABASE_STANDARDS.md PK-003) — that includes
// `reversalOfJournalEntryId`, this Aggregate's own internal self-
// referential FK, which is DELIBERATELY OMITTED here rather than resolved
// to the original entry's `uuid` — the identical carried-forward Handbook
// Deviation already documented in exchange-rate.response.dto.ts/
// fiscal-period.response.dto.ts (resolving it would require an extra
// `IJournalEntryRepository` lookup per row, out of scope for this
// milestone; the Business layer's frozen `JournalEntry` type does not
// expose a `reversalOfJournalEntryUuid` field to read instead).
//
// Each line's `accountId` (internal FK, PK-003) is likewise never
// serialized, and — unlike `reversalOfJournalEntryId` above — CANNOT be
// resolved to the referenced Account's `uuid` at all within this frozen
// architecture: `IAccountingRepository` (frozen, not modified this
// milestone) has no by-internal-`id` Account lookup, only
// `findAccountByUuid`/`findAccountByCode`, and `JournalEntryLine` (frozen
// Domain shape) carries only the Account's `id`. This is a genuine,
// flagged architectural limitation (see this milestone's "Architectural
// Risks"), not a silent omission: a client reading a Journal Entry's lines
// currently sees each line's amounts but not which Account it posted
// against. Resolving this needs either a Repository-layer addition (a
// by-id Account lookup, or storing `accountUuid` directly on
// `JournalEntryLine`) — both out of scope, Repository frozen — or a
// dedicated read-model, a future milestone's concern.
const journalEntryLineResponseSchema = z.object({
  uuid: z.string().uuid(),
  debitAmount: z.string(),
  creditAmount: z.string(),
});

export const journalEntryResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  postingDate: z.date(),
  narration: z.string().nullable(),
  status: z.nativeEnum(JournalEntryStatus),
  lines: z.array(journalEntryLineResponseSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type JournalEntryResponse = z.infer<typeof journalEntryResponseSchema>;

/** Structural rather than importing the Domain `JournalEntryLine` type (Presentation must not import domain/, Ch.9.3). `debitAmount`/`creditAmount` are duck-typed to just the `toString()` a `DecimalValue` provides. */
interface JournalEntryLineLike {
  uuid: string;
  debitAmount: { toString(): string };
  creditAmount: { toString(): string };
}

/** Structural rather than importing the Domain `JournalEntry` type. */
interface JournalEntryLike {
  uuid: string;
  companyUuid: string;
  postingDate: Date;
  narration: string | null;
  status: string;
  lines: JournalEntryLineLike[];
  createdAt: Date;
  updatedAt: Date;
}

export function toJournalEntryResponse(journalEntry: JournalEntryLike): JournalEntryResponse {
  return {
    uuid: journalEntry.uuid,
    companyUuid: journalEntry.companyUuid,
    postingDate: journalEntry.postingDate,
    narration: journalEntry.narration,
    status: journalEntry.status as JournalEntryStatus,
    lines: journalEntry.lines.map((line) => ({
      uuid: line.uuid,
      debitAmount: line.debitAmount.toString(),
      creditAmount: line.creditAmount.toString(),
    })),
    createdAt: journalEntry.createdAt,
    updatedAt: journalEntry.updatedAt,
  };
}
