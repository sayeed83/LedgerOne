import { z } from "zod";

// Only the fields `update-inventory-adjustment.service.ts`'s own
// `UpdateInventoryAdjustmentInput` accepts are exposed here — `quantity`,
// `reason`, `remarks` (per this milestone's own explicit field list).
// `uuid`/`tenantId`/`createdBy`/`updatedBy`/`deletedAt` are never accepted
// from the request body (06_DATABASE_STANDARDS.md PK-003 — the Business
// layer always resolves/defaults those itself). `remarks` is
// `nullable().optional()` — distinguishes "omit the field, leave the
// existing value untouched" (`undefined`) from "explicitly clear it"
// (`null`), mirroring update-warehouse.dto.ts's own `description` treatment
// exactly. `quantity`/`reason` mirror create-inventory-adjustment.dto.ts's
// own shape-only validation.
export const updateInventoryAdjustmentRequestSchema = z.object({
  quantity: z.string().min(1).optional(),
  reason: z.string().min(1).max(255).optional(),
  remarks: z.string().min(1).max(500).nullable().optional(),
});

export type UpdateInventoryAdjustmentRequest = z.infer<typeof updateInventoryAdjustmentRequestSchema>;
