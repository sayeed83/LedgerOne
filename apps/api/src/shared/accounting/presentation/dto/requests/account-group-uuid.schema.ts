import { z } from "zod";

// Path-param validator for `:accountGroupUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const accountGroupUuidParamSchema = z.object({
  accountGroupUuid: z.string().uuid(),
});

export type AccountGroupUuidParam = z.infer<typeof accountGroupUuidParamSchema>;
