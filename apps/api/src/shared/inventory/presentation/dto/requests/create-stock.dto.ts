import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Stock-specific data), mirroring create-warehouse.dto.ts. `companyUuid`/
// `warehouseUuid` are cross-module/in-module uuid-reference fields
// (FK-002) — accepted as client input but never validated for existence
// here. `productId` is the Business layer's own `CreateStockInput` contract
// (a real, in-module FK, not a `productUuid` resolved to one — no
// `findProductByUuid` lookup happens in `createStock`), so it is accepted
// here as a decimal numeric string and transformed to a `bigint`, mirroring
// `tenant-id-header.schema.ts`'s own numeric-string-to-`bigint` convention.
// `quantityOnHand`/`quantityReserved`/`quantityAvailable` are validated only
// for non-empty shape here (`min(1)`) — the actual "is this a well-formed
// decimal" invariant is not enforced by any Domain value object for Stock
// yet (unlike `create-exchange-rate.dto.ts`'s own `DecimalValue`-backed
// `rate` field), mirroring `create-unit.dto.ts`'s own `conversionFactor`
// treatment. `createdBy`/`updatedBy` are deliberately not accepted from the
// request body at all — no existing Inventory create/update DTO accepts
// them either (the Business layer always defaults them to `null`).
export const createStockRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  warehouseUuid: z.string().uuid(),
  productId: z
    .string()
    .regex(/^\d+$/, "productId must be a numeric string")
    .transform((value) => BigInt(value)),
  quantityOnHand: z.string().min(1).optional(),
  quantityReserved: z.string().min(1).optional(),
  quantityAvailable: z.string().min(1).optional(),
});

export type CreateStockRequest = z.infer<typeof createStockRequestSchema>;
