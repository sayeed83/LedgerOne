import { z } from "zod";

// Path-param validator for `:unitUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const unitUuidParamSchema = z.object({
  unitUuid: z.string().uuid(),
});

export type UnitUuidParam = z.infer<typeof unitUuidParamSchema>;
