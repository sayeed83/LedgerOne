import { z } from "zod";

// Never the `ReorderLevel` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003), mirroring batch.response.dto.ts
// exactly. `productId` is the one deliberate exception carried over from the
// Business layer's own contract (`createReorderLevel`/`updateReorderLevel`
// take a real `productId`, not a `productUuid` resolved to one), mirroring
// `batch.response.dto.ts`'s own identical `productId` treatment — serialized
// as a string since JSON has no native `bigint` type.
export const reorderLevelResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  warehouseUuid: z.string().uuid(),
  productId: z.string(),
  reorderLevel: z.string(),
  reorderQuantity: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ReorderLevelResponse = z.infer<typeof reorderLevelResponseSchema>;

/** Structural rather than importing the Domain `ReorderLevel` type (Presentation must not import domain/, Ch.9.3). */
interface ReorderLevelLike {
  uuid: string;
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  reorderLevel: string;
  reorderQuantity: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toReorderLevelResponse(reorderLevel: ReorderLevelLike): ReorderLevelResponse {
  return {
    uuid: reorderLevel.uuid,
    companyUuid: reorderLevel.companyUuid,
    warehouseUuid: reorderLevel.warehouseUuid,
    productId: reorderLevel.productId.toString(),
    reorderLevel: reorderLevel.reorderLevel,
    reorderQuantity: reorderLevel.reorderQuantity,
    createdAt: reorderLevel.createdAt,
    updatedAt: reorderLevel.updatedAt,
  };
}
