import { z } from "zod";
import { ProductStatus } from "@ledgerone/shared-types";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create/update-product.dto.ts field shapes/limits
// exactly (productCode VARCHAR(32), name VARCHAR(150), description
// VARCHAR(500) per inventory.prisma) — no invented validation rules.
export const productFormSchema = z.object({
  companyUuid: uuidSchema,
  productCode: z.string().min(1, "Product code is required.").max(32, "Product code must be at most 32 characters."),
  name: z.string().min(1, "Name is required.").max(150, "Name must be at most 150 characters."),
  description: z.string().max(500, "Description must be at most 500 characters.").optional(),
  productCategoryUuid: uuidSchema,
  unitUuid: z.string().optional(),
  isStocked: z.boolean().default(false),
  status: z.nativeEnum(ProductStatus, { errorMap: () => ({ message: "Select a status." }) }),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
