import { z } from "zod";

// Path-param validator for `:productUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const productUuidParamSchema = z.object({
  productUuid: z.string().uuid(),
});

export type ProductUuidParam = z.infer<typeof productUuidParamSchema>;
