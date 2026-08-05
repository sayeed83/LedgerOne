import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Journal-Entry-specific data), mirroring create-financial-year.dto.ts.
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid` — accepted as client input but never validated for
// existence here, same posture as every other Company-scoped create
// endpoint in this module. `postingDate` arrives as an ISO date string over
// JSON and is coerced to `Date` (00_BUSINESS_RULES.md Ch.20.3). `narration`
// max length mirrors the `VARCHAR(500)` column width (accounting.prisma).
//
// `lines[].accountUuid` is an external Account identifier
// (06_DATABASE_STANDARDS.md PK-003), resolved to its internal id by the
// Business layer (`validatePostingAccount`). `debitAmount`/`creditAmount`
// are validated only for non-empty shape here (`min(1)`) — the actual "is
// this a well-formed decimal" invariant (`DecimalValue.create`) and the
// "exactly one side positive" structural rule
// (`InvalidJournalEntryLineAmountError`) are both enforced once, by the
// Domain/Business layer, not duplicated here as a second, possibly-
// inconsistent regex, mirroring create-exchange-rate.dto.ts's identical
// `rate` treatment. `.min(2)` on `lines` gives fast client feedback for the
// same DBL-002 minimum-lines invariant `createJournalEntry` re-enforces
// authoritatively — an early, non-authoritative shape check, not a
// duplicate source of truth.
const createJournalEntryLineSchema = z.object({
  accountUuid: z.string().uuid(),
  debitAmount: z.string().min(1),
  creditAmount: z.string().min(1),
});

export const createJournalEntryRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  postingDate: z.coerce.date(),
  narration: z.string().max(500).optional(),
  lines: z.array(createJournalEntryLineSchema).min(2),
});

export type CreateJournalEntryRequest = z.infer<typeof createJournalEntryRequestSchema>;
