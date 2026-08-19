import { z } from "zod";
import { StockMovementType } from "../../../business/inventory-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Stock-Movement-specific data), mirroring create-inventory-adjustment.dto.ts.
// `companyUuid` is a cross-module uuid-reference field (FK-002) —
// accepted as client input but never validated for existence here.
// `sourceWarehouseUuid`/`destinationWarehouseUuid` are both optional
// cross-module/in-module uuid-reference fields (FK-002) implementing
// Ch.39.10's ERD's two independent Warehouse relationships — which one(s)
// are actually required for a given `movementType` is validated by the
// Business layer's own `createStockMovement` (Ch.39.8/STM-003), not here.
// `productId` is the Business layer's own `CreateStockMovementInput`
// contract (a real, in-module FK, not a `productUuid` resolved to one),
// mirroring create-inventory-adjustment.dto.ts's own `productId` treatment
// exactly. `quantity` is validated only for non-empty shape here
// (`min(1)`) — no Domain value object enforces the decimal-format invariant
// for Stock Movement yet, mirroring Stock's/Inventory Adjustment's own
// quantity-field treatment. `referenceType` max length mirrors the
// `VARCHAR(50)` column width (inventory.prisma); `referenceUuid` is a plain
// uuid. `createdBy` is deliberately not accepted from the request body at
// all — no existing Inventory create DTO accepts it either (the Business
// layer always defaults it to `null`).
export const createStockMovementRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  productId: z
    .string()
    .regex(/^\d+$/, "productId must be a numeric string")
    .transform((value) => BigInt(value)),
  sourceWarehouseUuid: z.string().uuid().optional(),
  destinationWarehouseUuid: z.string().uuid().optional(),
  movementType: z.nativeEnum(StockMovementType),
  quantity: z.string().min(1),
  referenceType: z.string().min(1).max(50).optional(),
  referenceUuid: z.string().uuid().optional(),
});

export type CreateStockMovementRequest = z.infer<typeof createStockMovementRequestSchema>;
