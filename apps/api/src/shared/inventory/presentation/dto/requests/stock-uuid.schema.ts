import { z } from "zod";

// Path-param validator for `:stockUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API
// boundary), mirroring warehouse-uuid.schema.ts exactly.
export const stockUuidParamSchema = z.object({
  stockUuid: z.string().uuid(),
});

export type StockUuidParam = z.infer<typeof stockUuidParamSchema>;
