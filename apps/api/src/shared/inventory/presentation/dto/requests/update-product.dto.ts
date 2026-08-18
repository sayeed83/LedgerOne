import { z } from "zod";
import { ProductStatus } from "../../../business/inventory-types";

// `description`/`unitUuid` are `nullable().optional()` — the same
// documented, minimal choice update-unit.dto.ts made for `baseUnitUuid`:
// distinguishes "omit the field, leave the existing value untouched"
// (`undefined`) from "explicitly clear it" (`null`), matching the Business
// layer's own `update-product.service.ts` input contract exactly.
// `productCategoryUuid` has no `null` variant — PCT-001 requires exactly
// one Product Category at all times, so there is no "clear it" state,
// mirroring `updateProduct`'s own `string | undefined`-only contract.
// `status`/`isStocked` are accepted with no transition/immutability
// validation, for the same reason create-product.dto.ts's own `status`
// field carries none (PRD-003/Ch.34.12 deferred).
export const updateProductRequestSchema = z.object({
  productCode: z.string().min(1).max(32).optional(),
  name: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(500).nullable().optional(),
  productCategoryUuid: z.string().uuid().optional(),
  unitUuid: z.string().uuid().nullable().optional(),
  isStocked: z.boolean().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
