import { z } from "zod";
import { JournalEntryStatus } from "../../../business/accounting-types";

// `companyUuid`/`status` are optional query filters narrowing the
// tenant-wide list, mirroring list-accounts-query.dto.ts's optional-filter
// shape.
export const listJournalEntriesQuerySchema = z.object({
  companyUuid: z.string().uuid().optional(),
  status: z.nativeEnum(JournalEntryStatus).optional(),
});

export type ListJournalEntriesQuery = z.infer<typeof listJournalEntriesQuerySchema>;
