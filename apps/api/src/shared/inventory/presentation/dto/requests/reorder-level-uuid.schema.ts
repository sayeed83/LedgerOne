import { z } from "zod";

// Path-param validator for `:reorderLevelUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API
// boundary), mirroring batch-uuid.schema.ts/warehouse-uuid.schema.ts exactly.
export const reorderLevelUuidParamSchema = z.object({
  reorderLevelUuid: z.string().uuid(),
});

export type ReorderLevelUuidParam = z.infer<typeof reorderLevelUuidParamSchema>;
