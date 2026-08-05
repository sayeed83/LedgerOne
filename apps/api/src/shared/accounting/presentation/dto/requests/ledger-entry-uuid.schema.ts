import { z } from "zod";

// Path-param validator for `:ledgerEntryUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API
// boundary), mirroring journal-entry-uuid.schema.ts exactly.
export const ledgerEntryUuidParamSchema = z.object({
  ledgerEntryUuid: z.string().uuid(),
});

export type LedgerEntryUuidParam = z.infer<typeof ledgerEntryUuidParamSchema>;
