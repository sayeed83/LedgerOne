import { z } from "zod";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create/update-reorder-level.dto.ts field shapes
// exactly — no invented validation rules. `productId` mirrors the backend's
// own numeric-string regex (`/^\d+$/`), not a uuid — Reorder Level's
// `productId` is a raw internal FK, identical treatment to Batch's/Stock's/
// Inventory Adjustment's own `productId` (see batch.schema.ts's own header
// comment for the backend-inherited reason no Product uuid can be used
// here). `branchUuid` is a form-only field (Reorder Level carries no
// `branchUuid` of its own) — it exists solely to scope `WarehouseSelect`'s
// fetch, mirroring `BatchForm`'s own `branchUuid` field, and is stripped out
// before submission. `reorderLevel`/`reorderQuantity` are validated only for
// non-empty shape (`min(1)`), mirroring the backend's own
// create-reorder-level.dto.ts/update-reorder-level.dto.ts — Ch.42.8's
// non-negative-quantity invariant is re-validated once, by the backend's own
// Business layer (`InvalidReorderLevelQuantityError`), not duplicated here
// as a client-side rule.
export const reorderLevelFormSchema = z.object({
  companyUuid: uuidSchema,
  branchUuid: uuidSchema,
  warehouseUuid: uuidSchema,
  productId: z.string().regex(/^\d+$/, "Product ID must be a numeric value."),
  reorderLevel: z.string().min(1, "Enter a Reorder Level."),
  reorderQuantity: z.string().min(1, "Enter a Reorder Quantity."),
});

export type ReorderLevelFormValues = z.infer<typeof reorderLevelFormSchema>;
