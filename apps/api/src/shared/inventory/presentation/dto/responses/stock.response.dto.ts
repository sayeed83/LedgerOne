import { z } from "zod";

// Never the `Stock` Domain entity itself (05_CODING_STANDARDS.md Ch.16.3) —
// a separate, flatter shape. Internal `id`/`tenantId`/`createdBy`/
// `updatedBy`/`deletedAt` are never serialized (06_DATABASE_STANDARDS.md
// PK-003), mirroring warehouse.response.dto.ts exactly. `productId` is the
// one deliberate exception carried over from the Business layer's own
// contract (`createStock`/`updateStock` take a real `productId`, not a
// `productUuid` resolved to one — no Product lookup happens in either
// service, mirroring `product.response.dto.ts`'s own documented
// `productCategoryId`/`unitId` omission in reverse: there is no repository
// call available here to resolve it to the owning Product's `uuid` without
// a second Business-service call, which a controller restricted to exactly
// one Business-service call cannot make). Serialized as a string since JSON
// has no native `bigint` type.
export const stockResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  warehouseUuid: z.string().uuid(),
  productId: z.string(),
  quantityOnHand: z.string(),
  quantityReserved: z.string(),
  quantityAvailable: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StockResponse = z.infer<typeof stockResponseSchema>;

/** Structural rather than importing the Domain `Stock` type (Presentation must not import domain/, Ch.9.3). */
interface StockLike {
  uuid: string;
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  quantityOnHand: string;
  quantityReserved: string;
  quantityAvailable: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toStockResponse(stock: StockLike): StockResponse {
  return {
    uuid: stock.uuid,
    companyUuid: stock.companyUuid,
    warehouseUuid: stock.warehouseUuid,
    productId: stock.productId.toString(),
    quantityOnHand: stock.quantityOnHand,
    quantityReserved: stock.quantityReserved,
    quantityAvailable: stock.quantityAvailable,
    createdAt: stock.createdAt,
    updatedAt: stock.updatedAt,
  };
}
