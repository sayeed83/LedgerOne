import { z } from "zod";
import { StockMovementType } from "@ledgerone/shared-types";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create-stock-movement.dto.ts field shapes exactly —
// no invented validation rules. `productId` mirrors the backend's own
// numeric-string regex (`/^\d+$/`), not a uuid — Stock Movement's
// `productId` is a raw internal FK, identical treatment to Stock's/
// Inventory Adjustment's own `productId` (see stock.schema.ts's own header
// comment for the backend-inherited reason no Product uuid can be used
// here). `branchUuid` is a form-only field (Stock Movement carries no
// `branchUuid` of its own) — it exists solely to scope both
// `WarehouseSelect` pickers' fetch, mirroring `InventoryAdjustmentForm`'s
// own `branchUuid` field, and is stripped out before submission.
// `sourceWarehouseUuid`/`destinationWarehouseUuid` are both optional at the
// object-shape level (mirroring `unitUuid`/`baseUnitUuid`'s own optional-FK
// convention elsewhere in this module) — the `superRefine` below re-states
// the backend's own `createStockMovement` per-`movementType` requirement
// (00_BUSINESS_RULES.md Ch.39.8/STM-003: RECEIPT needs a destination
// Warehouse, ISSUE needs a source Warehouse, TRANSFER needs both; ADJUSTMENT
// has no Ch.39.8-stated requirement and is left unconstrained here too) —
// this is not a new/invented rule, only the same server-side validation
// (`StockMovementMissingRequiredWarehouseError`/`INV_STOCK_MOVEMENT_INVALID_WAREHOUSE`)
// surfaced client-side for immediate feedback; the server remains
// authoritative. `quantity` is validated only for non-empty shape
// (`min(1)`), mirroring Stock's/Inventory Adjustment's own quantity-field
// treatment (no Domain value object enforces the decimal-format invariant
// for Stock Movement yet). `referenceType` max length mirrors the
// `VARCHAR(50)` column width (inventory.prisma); `referenceUuid` is
// optional and, when supplied, must be a valid uuid.
export const stockMovementFormSchema = z
  .object({
    companyUuid: uuidSchema,
    branchUuid: uuidSchema,
    productId: z.string().regex(/^\d+$/, "Product ID must be a numeric value."),
    sourceWarehouseUuid: z.string().optional(),
    destinationWarehouseUuid: z.string().optional(),
    movementType: z.nativeEnum(StockMovementType, { errorMap: () => ({ message: "Select a movement type." }) }),
    quantity: z.string().min(1, "Enter a quantity."),
    referenceType: z.string().max(50, "Reference type must be at most 50 characters.").optional(),
    referenceUuid: z.union([z.string().uuid("Enter a valid Reference UUID."), z.literal("")]).optional(),
  })
  .superRefine((values, ctx) => {
    const hasSource = Boolean(values.sourceWarehouseUuid);
    const hasDestination = Boolean(values.destinationWarehouseUuid);

    if (values.movementType === StockMovementType.Receipt && !hasDestination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationWarehouseUuid"],
        message: "A Receipt requires a destination Warehouse.",
      });
    }
    if (values.movementType === StockMovementType.Issue && !hasSource) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceWarehouseUuid"],
        message: "An Issue requires a source Warehouse.",
      });
    }
    if (values.movementType === StockMovementType.Transfer) {
      if (!hasSource) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceWarehouseUuid"],
          message: "A Transfer requires both a source and a destination Warehouse.",
        });
      }
      if (!hasDestination) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationWarehouseUuid"],
          message: "A Transfer requires both a source and a destination Warehouse.",
        });
      }
    }
    // ADJUSTMENT: Ch.39.8 states no Warehouse-side requirement — not checked here, mirroring the backend.
  });

export type StockMovementFormValues = z.infer<typeof stockMovementFormSchema>;
