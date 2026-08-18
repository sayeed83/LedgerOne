import { z } from "zod";

// Path-param validator for `:warehouseUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const warehouseUuidParamSchema = z.object({
  warehouseUuid: z.string().uuid(),
});

export type WarehouseUuidParam = z.infer<typeof warehouseUuidParamSchema>;
