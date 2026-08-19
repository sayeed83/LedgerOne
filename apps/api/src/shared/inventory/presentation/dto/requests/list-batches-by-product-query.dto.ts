import { z } from "zod";

// `productId` is required, not optional — mirrors the Business layer's own
// `listBatchesByProduct` shape (a distinct use case from a tenant/company-
// wide list, not an optional filter on one), matching
// list-inventory-adjustments-by-warehouse-query.dto.ts's own
// `warehouseUuid`-required convention. A real, in-module FK (not a
// `productUuid` resolved to one), accepted as a decimal numeric string and
// transformed to a `bigint`, mirroring create-batch.dto.ts's own
// `productId` treatment exactly.
export const listBatchesByProductQuerySchema = z.object({
  productId: z
    .string()
    .regex(/^\d+$/, "productId must be a numeric string")
    .transform((value) => BigInt(value)),
});

export type ListBatchesByProductQuery = z.infer<typeof listBatchesByProductQuerySchema>;
