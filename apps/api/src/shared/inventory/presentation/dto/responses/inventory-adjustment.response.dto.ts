import { z } from "zod";
import { AdjustmentType } from "../../../business/inventory-types";

// Never the `InventoryAdjustment` Domain entity itself
// (05_CODING_STANDARDS.md Ch.16.3) — a separate, flatter shape. Internal
// `id`/`tenantId`/`createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003), mirroring stock.response.dto.ts
// exactly. `productId` is the one deliberate exception carried over from
// the Business layer's own contract (`createInventoryAdjustment`/
// `updateInventoryAdjustment` take a real `productId`, not a `productUuid`
// resolved to one), mirroring `stock.response.dto.ts`'s own identical
// `productId` treatment — serialized as a string since JSON has no native
// `bigint` type.
export const inventoryAdjustmentResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  warehouseUuid: z.string().uuid(),
  productId: z.string(),
  adjustmentType: z.nativeEnum(AdjustmentType),
  quantity: z.string(),
  reason: z.string(),
  remarks: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InventoryAdjustmentResponse = z.infer<typeof inventoryAdjustmentResponseSchema>;

/** Structural rather than importing the Domain `InventoryAdjustment` type (Presentation must not import domain/, Ch.9.3). */
interface InventoryAdjustmentLike {
  uuid: string;
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  adjustmentType: AdjustmentType;
  quantity: string;
  reason: string;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toInventoryAdjustmentResponse(
  inventoryAdjustment: InventoryAdjustmentLike,
): InventoryAdjustmentResponse {
  return {
    uuid: inventoryAdjustment.uuid,
    companyUuid: inventoryAdjustment.companyUuid,
    warehouseUuid: inventoryAdjustment.warehouseUuid,
    productId: inventoryAdjustment.productId.toString(),
    adjustmentType: inventoryAdjustment.adjustmentType,
    quantity: inventoryAdjustment.quantity,
    reason: inventoryAdjustment.reason,
    remarks: inventoryAdjustment.remarks,
    createdAt: inventoryAdjustment.createdAt,
    updatedAt: inventoryAdjustment.updatedAt,
  };
}
