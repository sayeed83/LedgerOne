import { z } from "zod";
import { BatchStatus } from "@ledgerone/shared-types";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create/update-batch.dto.ts field shapes/limits
// exactly (batchNumber VARCHAR(100) per inventory.prisma) — no invented
// validation rules. Ch.40.8's "expiry date, if provided, must be after the
// manufacture date" is re-validated once, by the backend's own Business
// layer (`InvalidBatchDateRangeError`), not duplicated here as a
// client-side rule. `productId` mirrors the backend's own numeric-string
// regex (`/^\d+$/`), not a uuid — Batch's `productId` is a raw internal FK,
// identical treatment to Stock's/Inventory Adjustment's own `productId`
// (see stock.schema.ts's own header comment for the backend-inherited
// reason no Product uuid can be used here). `branchUuid` is a form-only
// field (Batch carries no `branchUuid` of its own) — it exists solely to
// scope `WarehouseSelect`'s fetch, mirroring `InventoryAdjustmentForm`'s own
// `branchUuid` field, and is stripped out before submission.
// `manufactureDate`/`expiryDate` are plain, optional date-input strings
// (HTML `<input type="date">` value shape) — both optional, mirroring the
// backend's own `create-batch.dto.ts` (neither is mandatory per Ch.40.3).
// `quantity` is optional, mirroring the backend's own `createBatch`
// contract. `status` defaults to Active and is always submitted, mirroring
// `warehouseFormSchema`'s own `status` treatment exactly.
export const batchFormSchema = z.object({
  companyUuid: uuidSchema,
  branchUuid: uuidSchema,
  warehouseUuid: uuidSchema,
  productId: z.string().regex(/^\d+$/, "Product ID must be a numeric value."),
  batchNumber: z.string().min(1, "Batch number is required.").max(100, "Batch number must be at most 100 characters."),
  manufactureDate: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.string().optional(),
  status: z.nativeEnum(BatchStatus, { errorMap: () => ({ message: "Select a status." }) }),
});

export type BatchFormValues = z.infer<typeof batchFormSchema>;
