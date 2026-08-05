import { z } from "zod";

// Path-param validator for `:accountUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const accountUuidParamSchema = z.object({
  accountUuid: z.string().uuid(),
});

export type AccountUuidParam = z.infer<typeof accountUuidParamSchema>;
