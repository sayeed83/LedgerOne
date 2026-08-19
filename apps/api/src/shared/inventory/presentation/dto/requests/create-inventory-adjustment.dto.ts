import { z } from "zod";
import { AdjustmentType } from "../../../business/inventory-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Inventory-Adjustment-specific data), mirroring create-warehouse.dto.ts.
// `companyUuid`/`warehouseUuid` are cross-module/in-module uuid-reference
// fields (FK-002) — accepted as client input but never validated for
// existence here. `productId` is the Business layer's own
// `CreateInventoryAdjustmentInput` contract (a real, in-module FK, not a
// `productUuid` resolved to one — no `findProductByUuid` lookup happens in
// `createInventoryAdjustment`), so it is accepted here as a decimal numeric
// string and transformed to a `bigint`, mirroring create-stock.dto.ts's own
// `productId` treatment exactly. `quantity` is validated only for non-empty
// shape here (`min(1)`) — no Domain value object enforces the
// decimal-format invariant for Inventory Adjustment yet, mirroring Stock's
// own quantity-field treatment. `reason`/`remarks` max lengths mirror the
// `VARCHAR(255)`/`VARCHAR(500)` column widths (inventory.prisma).
// `createdBy` is deliberately not accepted from the request body at all —
// no existing Inventory create DTO accepts it either (the Business layer
// always defaults it to `null`).
export const createInventoryAdjustmentRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  warehouseUuid: z.string().uuid(),
  productId: z
    .string()
    .regex(/^\d+$/, "productId must be a numeric string")
    .transform((value) => BigInt(value)),
  adjustmentType: z.nativeEnum(AdjustmentType),
  quantity: z.string().min(1),
  reason: z.string().min(1).max(255),
  remarks: z.string().min(1).max(500).optional(),
});

export type CreateInventoryAdjustmentRequest = z.infer<typeof createInventoryAdjustmentRequestSchema>;
