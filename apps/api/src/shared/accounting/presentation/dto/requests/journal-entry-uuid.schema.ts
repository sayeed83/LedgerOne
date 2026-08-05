import { z } from "zod";

// Path-param validator for `:journalEntryUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary),
// mirroring account-uuid.schema.ts exactly.
export const journalEntryUuidParamSchema = z.object({
  journalEntryUuid: z.string().uuid(),
});

export type JournalEntryUuidParam = z.infer<typeof journalEntryUuidParamSchema>;
