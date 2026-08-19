import { z } from "zod";

// Path-param validator for `:adjustmentUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API
// boundary), mirroring warehouse-uuid.schema.ts/stock-uuid.schema.ts
// exactly.
export const inventoryAdjustmentUuidParamSchema = z.object({
  adjustmentUuid: z.string().uuid(),
});

export type InventoryAdjustmentUuidParam = z.infer<typeof inventoryAdjustmentUuidParamSchema>;
