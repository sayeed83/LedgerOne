import { z } from "zod";

// Path-param validator for `:taxGroupUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const taxGroupUuidParamSchema = z.object({
  taxGroupUuid: z.string().uuid(),
});

export type TaxGroupUuidParam = z.infer<typeof taxGroupUuidParamSchema>;
