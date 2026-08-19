import { z } from "zod";
import { AdjustmentType } from "@ledgerone/shared-types";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create/update-inventory-adjustment.dto.ts field
// shapes/limits exactly (reason VARCHAR(255), remarks VARCHAR(500) per
// inventory.prisma) — no invented validation rules. `productId` mirrors the
// backend's own numeric-string regex (`/^\d+$/`), not a uuid — Inventory
// Adjustment's `productId` is a raw internal FK, identical treatment to
// Stock's own `productId` (see stock.schema.ts's own header comment for the
// backend-inherited reason no Product uuid can be used here). `branchUuid`
// is a form-only field (Inventory Adjustment carries no `branchUuid` of its
// own) — it exists solely to scope `WarehouseSelect`'s fetch, mirroring
// `StockForm`'s own `branchUuid` field, and is stripped out before
// submission. `quantity` is required (unlike Stock's own optional quantity
// fields) — the backend's own `createInventoryAdjustment` requires it.
export const inventoryAdjustmentFormSchema = z.object({
  companyUuid: uuidSchema,
  branchUuid: uuidSchema,
  warehouseUuid: uuidSchema,
  productId: z.string().regex(/^\d+$/, "Product ID must be a numeric value."),
  adjustmentType: z.nativeEnum(AdjustmentType, { errorMap: () => ({ message: "Select an adjustment type." }) }),
  quantity: z.string().min(1, "Enter a quantity."),
  reason: z.string().min(1, "Reason is required.").max(255, "Reason must be at most 255 characters."),
  remarks: z.string().max(500, "Remarks must be at most 500 characters.").optional(),
});

export type InventoryAdjustmentFormValues = z.infer<typeof inventoryAdjustmentFormSchema>;
