import { z } from "zod";

// `parentProductCategoryUuid`/`defaultTaxGroupUuid` are both
// `nullable().optional()` — the same documented, minimal choice
// Accounting's update-account-group.dto.ts made: distinguishes "omit the
// field, leave the existing value untouched" (`undefined`) from
// "explicitly clear it" (`null`), matching the Business layer's own
// `update-product-category.service.ts` input contract exactly.
export const updateProductCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentProductCategoryUuid: z.string().uuid().nullable().optional(),
  defaultTaxGroupUuid: z.string().uuid().nullable().optional(),
});

export type UpdateProductCategoryRequest = z.infer<typeof updateProductCategoryRequestSchema>;
