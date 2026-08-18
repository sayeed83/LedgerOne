import { z } from "zod";

// `warehouseUuid`/`productId` are both optional here only because
// `update-stock.service.ts`'s own `UpdateStockInput` accepts them purely to
// re-validate STK-003's Warehouse/Product uniqueness — they are never
// persisted by `repository.updateStock` (see that service's own header
// comment). `productId` mirrors create-stock.dto.ts's own numeric-string-to-
// `bigint` transform. `quantityOnHand`/`quantityReserved`/`quantityAvailable`
// are validated only for non-empty shape (`min(1)`), mirroring
// update-unit.dto.ts's own `conversionFactor` treatment — no Domain value
// object enforces the decimal-format invariant for Stock yet. `updatedBy` is
// deliberately not accepted from the request body, mirroring every other
// Inventory update DTO (the Business layer always defaults it to `null`).
export const updateStockRequestSchema = z.object({
  warehouseUuid: z.string().uuid().optional(),
  productId: z
    .string()
    .regex(/^\d+$/, "productId must be a numeric string")
    .transform((value) => BigInt(value))
    .optional(),
  quantityOnHand: z.string().min(1).optional(),
  quantityReserved: z.string().min(1).optional(),
  quantityAvailable: z.string().min(1).optional(),
});

export type UpdateStockRequest = z.infer<typeof updateStockRequestSchema>;
