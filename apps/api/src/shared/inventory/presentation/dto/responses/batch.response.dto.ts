import { z } from "zod";
import { BatchStatus } from "../../../business/inventory-types";

// Never the `Batch` Domain entity itself (05_CODING_STANDARDS.md Ch.16.3) —
// a separate, flatter shape. Internal `id`/`tenantId`/`createdBy`/
// `updatedBy`/`deletedAt` are never serialized (06_DATABASE_STANDARDS.md
// PK-003), mirroring inventory-adjustment.response.dto.ts exactly.
// `productId` is the one deliberate exception carried over from the
// Business layer's own contract (`createBatch`/`updateBatch` take a real
// `productId`, not a `productUuid` resolved to one), mirroring
// `inventory-adjustment.response.dto.ts`'s/`stock.response.dto.ts`'s own
// identical `productId` treatment — serialized as a string since JSON has
// no native `bigint` type.
export const batchResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  productId: z.string(),
  warehouseUuid: z.string().uuid(),
  batchNumber: z.string(),
  manufactureDate: z.date().nullable(),
  expiryDate: z.date().nullable(),
  quantity: z.string(),
  status: z.nativeEnum(BatchStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BatchResponse = z.infer<typeof batchResponseSchema>;

/** Structural rather than importing the Domain `Batch` type (Presentation must not import domain/, Ch.9.3). */
interface BatchLike {
  uuid: string;
  companyUuid: string;
  productId: bigint;
  warehouseUuid: string;
  batchNumber: string;
  manufactureDate: Date | null;
  expiryDate: Date | null;
  quantity: string;
  status: BatchStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toBatchResponse(batch: BatchLike): BatchResponse {
  return {
    uuid: batch.uuid,
    companyUuid: batch.companyUuid,
    productId: batch.productId.toString(),
    warehouseUuid: batch.warehouseUuid,
    batchNumber: batch.batchNumber,
    manufactureDate: batch.manufactureDate,
    expiryDate: batch.expiryDate,
    quantity: batch.quantity,
    status: batch.status,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  };
}
