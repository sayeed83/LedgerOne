import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Reorder Level-specific data), mirroring create-batch.dto.ts. `companyUuid`/
// `warehouseUuid` are cross-module/in-module uuid-reference fields (FK-002) —
// accepted as client input but never validated for existence here.
// `productId` is the Business layer's own `CreateReorderLevelInput` contract
// (a real, in-module FK, not a `productUuid` resolved to one), so it is
// accepted here as a decimal numeric string and transformed to a `bigint`,
// mirroring create-batch.dto.ts's own `productId` treatment exactly.
// `reorderLevel`/`reorderQuantity` are validated only for non-empty shape
// here — Ch.42.8's non-negative-quantity invariant is enforced once, by the
// Business layer (`InvalidReorderLevelQuantityError`), not duplicated here,
// mirroring every other Inventory create DTO's quantity-field treatment.
// `createdBy` is deliberately not accepted from the request body at all — no
// existing Inventory create DTO accepts it either (the Business layer always
// defaults it to `null`).
export const createReorderLevelRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  warehouseUuid: z.string().uuid(),
  productId: z
    .string()
    .regex(/^\d+$/, "productId must be a numeric string")
    .transform((value) => BigInt(value)),
  reorderLevel: z.string().min(1),
  reorderQuantity: z.string().min(1),
});

export type CreateReorderLevelRequest = z.infer<typeof createReorderLevelRequestSchema>;
