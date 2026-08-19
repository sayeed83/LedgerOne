import { z } from "zod";
import { StockMovementType } from "../../../business/inventory-types";

// Never the `StockMovement` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003), mirroring
// inventory-adjustment.response.dto.ts's exposure list — except there is
// no `updatedAt` here at all: Stock Movement is immutable once recorded
// (Ch.39.5/STM-002), so this response mirrors `LedgerEntry`'s
// (accounting module) own response DTO in never exposing an
// `updatedAt`/`updatedBy` pair that could not exist. `productId` is the
// one deliberate exception carried over from the Business layer's own
// contract (`createStockMovement` takes a real `productId`, not a
// `productUuid` resolved to one), mirroring
// `inventory-adjustment.response.dto.ts`'s own identical `productId`
// treatment — serialized as a string since JSON has no native `bigint`
// type.
export const stockMovementResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  productId: z.string(),
  sourceWarehouseUuid: z.string().uuid().nullable(),
  destinationWarehouseUuid: z.string().uuid().nullable(),
  movementType: z.nativeEnum(StockMovementType),
  quantity: z.string(),
  referenceType: z.string().nullable(),
  referenceUuid: z.string().nullable(),
  createdAt: z.date(),
});

export type StockMovementResponse = z.infer<typeof stockMovementResponseSchema>;

/** Structural rather than importing the Domain `StockMovement` type (Presentation must not import domain/, Ch.9.3). */
interface StockMovementLike {
  uuid: string;
  companyUuid: string;
  productId: bigint;
  sourceWarehouseUuid: string | null;
  destinationWarehouseUuid: string | null;
  movementType: StockMovementType;
  quantity: string;
  referenceType: string | null;
  referenceUuid: string | null;
  createdAt: Date;
}

export function toStockMovementResponse(stockMovement: StockMovementLike): StockMovementResponse {
  return {
    uuid: stockMovement.uuid,
    companyUuid: stockMovement.companyUuid,
    productId: stockMovement.productId.toString(),
    sourceWarehouseUuid: stockMovement.sourceWarehouseUuid,
    destinationWarehouseUuid: stockMovement.destinationWarehouseUuid,
    movementType: stockMovement.movementType,
    quantity: stockMovement.quantity,
    referenceType: stockMovement.referenceType,
    referenceUuid: stockMovement.referenceUuid,
    createdAt: stockMovement.createdAt,
  };
}
