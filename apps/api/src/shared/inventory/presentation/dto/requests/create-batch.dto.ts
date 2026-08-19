import { z } from "zod";
import { BatchStatus } from "../../../business/inventory-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Batch-specific data), mirroring create-inventory-adjustment.dto.ts.
// `companyUuid`/`warehouseUuid` are cross-module/in-module uuid-reference
// fields (FK-002) — accepted as client input but never validated for
// existence here. `productId` is the Business layer's own
// `CreateBatchInput` contract (a real, in-module FK, not a `productUuid`
// resolved to one — no `findProductByUuid` lookup happens in
// `createBatch`), so it is accepted here as a decimal numeric string and
// transformed to a `bigint`, mirroring create-inventory-adjustment.dto.ts's/
// create-stock.dto.ts's own `productId` treatment exactly. `batchNumber`
// max length mirrors the `VARCHAR(100)` column width (inventory.prisma).
// `manufactureDate`/`expiryDate` arrive as ISO date strings over JSON and
// are coerced to `Date` (mirroring create-financial-year.dto.ts's own
// date-field treatment); both optional — Ch.40.3 never states either is
// mandatory. `quantity` is validated only for non-empty shape here
// (`min(1)`) — no Domain value object enforces the decimal-format invariant
// for Batch yet, mirroring Stock's/Inventory Adjustment's own quantity-field
// treatment. `status` is accepted as a plain, shape-only-validated enum
// value, mirroring create-warehouse.dto.ts's own `status` field. `createdBy`
// is deliberately not accepted from the request body at all — no existing
// Inventory create DTO accepts it either (the Business layer always
// defaults it to `null`). Ch.40.8's "expiry date, if provided, must be
// after the manufacture date" is enforced once, by the Business layer
// (`InvalidBatchDateRangeError`), not duplicated here.
export const createBatchRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  productId: z
    .string()
    .regex(/^\d+$/, "productId must be a numeric string")
    .transform((value) => BigInt(value)),
  warehouseUuid: z.string().uuid(),
  batchNumber: z.string().min(1).max(100),
  manufactureDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  quantity: z.string().min(1).optional(),
  status: z.nativeEnum(BatchStatus).optional(),
});

export type CreateBatchRequest = z.infer<typeof createBatchRequestSchema>;
