import { z } from "zod";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create/update-stock.dto.ts field shapes exactly —
// no invented validation rules. `productId` mirrors the backend's own
// numeric-string regex (`/^\d+$/`), not a uuid — Stock's `productId` is a
// raw internal FK (see stock.dto.ts's own header comment for the
// backend-inherited reason no Product uuid can be used here).
// `quantityOnHand`/`quantityReserved`/`quantityAvailable` are validated only
// for non-empty shape (`min(1)`), mirroring the backend's own
// create-stock.dto.ts/update-stock.dto.ts (no Domain value object enforces
// the decimal-format invariant for Stock yet, so nothing further is
// enforced here either). `branchUuid` is a form-only field (Stock carries no
// `branchUuid` of its own) — it exists solely to scope `WarehouseSelect`'s
// fetch, mirroring `WarehouseForm`'s own `branchUuid` field, and is stripped
// out before submission.
const decimalQuantitySchema = z.string().min(1, "Enter a quantity.").optional();

export const stockFormSchema = z.object({
  companyUuid: uuidSchema,
  branchUuid: uuidSchema,
  warehouseUuid: uuidSchema,
  productId: z.string().regex(/^\d+$/, "Product ID must be a numeric value."),
  quantityOnHand: decimalQuantitySchema,
  quantityReserved: decimalQuantitySchema,
  quantityAvailable: decimalQuantitySchema,
});

export type StockFormValues = z.infer<typeof stockFormSchema>;
