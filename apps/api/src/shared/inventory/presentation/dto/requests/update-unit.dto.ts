import { z } from "zod";

// `baseUnitUuid`/`conversionFactor` are both `nullable().optional()` — the
// same documented, minimal choice update-product-category.dto.ts made:
// distinguishes "omit the field, leave the existing value untouched"
// (`undefined`) from "explicitly clear it" (`null`), matching the Business
// layer's own `update-unit.service.ts` input contract exactly.
// `conversionFactor`'s decimal-format/positivity invariant is validated
// once, by the Business layer, not duplicated here (shape-only `min(1)`
// when a non-null value is supplied).
export const updateUnitRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(20).optional(),
  baseUnitUuid: z.string().uuid().nullable().optional(),
  conversionFactor: z.string().min(1).nullable().optional(),
});

export type UpdateUnitRequest = z.infer<typeof updateUnitRequestSchema>;
