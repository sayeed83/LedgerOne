import { z } from "zod";

// Path-param validator for `:movementUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API
// boundary), mirroring inventory-adjustment-uuid.schema.ts/
// warehouse-uuid.schema.ts exactly.
export const stockMovementUuidParamSchema = z.object({
  movementUuid: z.string().uuid(),
});

export type StockMovementUuidParam = z.infer<typeof stockMovementUuidParamSchema>;
