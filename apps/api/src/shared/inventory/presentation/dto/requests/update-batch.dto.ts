import { z } from "zod";
import { BatchStatus } from "../../../business/inventory-types";

// Only the fields `update-batch.service.ts`'s own `UpdateBatchInput`
// accepts are exposed here — `batchNumber`, `manufactureDate`,
// `expiryDate`, `quantity`, `status`. `uuid`/`tenantId`/`companyUuid`/
// `productId`/`warehouseUuid`/`createdBy`/`updatedBy`/`deletedAt` are never
// accepted from the request body (06_DATABASE_STANDARDS.md PK-003 — the
// Business layer always resolves/defaults those itself, and `productId`/
// `warehouseUuid` are not updatable fields on `UpdateBatchProps` either).
// `manufactureDate`/`expiryDate` are `nullable().optional()` — distinguishes
// "omit the field, leave the existing value untouched" (`undefined`) from
// "explicitly clear it" (`null`), mirroring update-warehouse.dto.ts's own
// `description` treatment exactly. `quantity`/`batchNumber` mirror
// create-batch.dto.ts's own shape-only validation. Ch.40.8's date-range
// re-validation is enforced once, by the Business layer
// (`InvalidBatchDateRangeError`), not duplicated here.
export const updateBatchRequestSchema = z.object({
  batchNumber: z.string().min(1).max(100).optional(),
  manufactureDate: z.coerce.date().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  quantity: z.string().min(1).optional(),
  status: z.nativeEnum(BatchStatus).optional(),
});

export type UpdateBatchRequest = z.infer<typeof updateBatchRequestSchema>;
