import { z } from "zod";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create/update-product-category.dto.ts field
// shapes/limits exactly (name VARCHAR(100) per inventory.prisma) — no
// invented validation rules. `parentProductCategoryUuid`/
// `defaultTaxGroupUuid` are both plain optional strings (not `uuidSchema`)
// mirroring `unitFormSchema`'s own `baseUnitUuid` shape — an unselected
// picker submits `""`, which the form's own submit handler (not this
// schema) converts to `undefined`.
export const productCategoryFormSchema = z.object({
  companyUuid: uuidSchema,
  name: z.string().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
  parentProductCategoryUuid: z.string().optional(),
  defaultTaxGroupUuid: z.string().optional(),
});

export type ProductCategoryFormValues = z.infer<typeof productCategoryFormSchema>;
