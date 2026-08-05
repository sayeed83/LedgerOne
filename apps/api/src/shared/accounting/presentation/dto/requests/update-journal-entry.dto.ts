import { z } from "zod";

// No `lines`/`companyUuid` — update-journal-entry.service.ts revises only
// `postingDate`/`narration` on an existing (Draft-only, JRN-003) Journal
// Entry; line mutation is a separate Repository-layer concern
// (`addJournalEntryLine`/`removeJournalEntryLine`) with no Presentation
// endpoint this milestone (not part of the handbook-defined endpoint list).
// `narration` is `nullable().optional()`, the same explicit-null-vs-omitted
// distinction as update-account.dto.ts's `parentAccountUuid`.
export const updateJournalEntryRequestSchema = z.object({
  postingDate: z.coerce.date().optional(),
  narration: z.string().max(500).nullable().optional(),
});

export type UpdateJournalEntryRequest = z.infer<typeof updateJournalEntryRequestSchema>;
