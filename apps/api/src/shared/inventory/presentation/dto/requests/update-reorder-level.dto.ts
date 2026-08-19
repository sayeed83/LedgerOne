import { z } from "zod";

// Only the fields `update-reorder-level.service.ts`'s own
// `UpdateReorderLevelInput` accepts are exposed here — `reorderLevel`,
// `reorderQuantity`. `uuid`/`tenantId`/`companyUuid`/`warehouseUuid`/
// `productId`/`createdBy`/`updatedBy`/`deletedAt` are never accepted from the
// request body (06_DATABASE_STANDARDS.md PK-003 — the Business layer always
// resolves/defaults those itself, and `warehouseUuid`/`productId` are not
// updatable fields on `UpdateReorderLevelProps` either, mirroring Batch's own
// `productId`/`warehouseUuid` immutability on update). `reorderLevel`/
// `reorderQuantity` mirror create-reorder-level.dto.ts's own shape-only
// validation — Ch.42.8's non-negative-quantity re-check is enforced once, by
// the Business layer, not duplicated here.
export const updateReorderLevelRequestSchema = z.object({
  reorderLevel: z.string().min(1).optional(),
  reorderQuantity: z.string().min(1).optional(),
});

export type UpdateReorderLevelRequest = z.infer<typeof updateReorderLevelRequestSchema>;
