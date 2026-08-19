import { z } from "zod";

// Path-param validator for `:batchUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API
// boundary), mirroring warehouse-uuid.schema.ts/inventory-adjustment-uuid.schema.ts
// exactly.
export const batchUuidParamSchema = z.object({
  batchUuid: z.string().uuid(),
});

export type BatchUuidParam = z.infer<typeof batchUuidParamSchema>;
