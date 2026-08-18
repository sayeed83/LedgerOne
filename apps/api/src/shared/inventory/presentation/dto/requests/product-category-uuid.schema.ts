import { z } from "zod";

// Path-param validator for `:productCategoryUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const productCategoryUuidParamSchema = z.object({
  productCategoryUuid: z.string().uuid(),
});

export type ProductCategoryUuidParam = z.infer<typeof productCategoryUuidParamSchema>;
