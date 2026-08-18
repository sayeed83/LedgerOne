import { z } from "zod";
import { ProductStatus } from "../../../business/inventory-types";

// Never the `Product` Domain entity itself (05_CODING_STANDARDS.md Ch.16.3)
// — a separate, flatter shape. Internal `id`/`tenantId`/`createdBy`/
// `updatedBy`/`deletedAt` are never serialized (06_DATABASE_STANDARDS.md
// PK-003) — that includes `productCategoryId`/`unitId`, this entity's own
// internal in-module FKs, which are DELIBERATELY OMITTED here rather than
// resolved to their respective `uuid`s. Resolving them would require an
// extra Repository/Business lookup per response row, which this
// milestone's controllers are not permitted to make (exactly one
// Business-service call, no repository calls) — the identical
// carried-forward Handbook Deviation already documented in
// unit.response.dto.ts/account.response.dto.ts (itself mirroring Product
// Category's/Account Group's own `parentProductCategoryId`/
// `parentAccountGroupId` omission), not a new one introduced here.
export const productResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  productCode: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isStocked: z.boolean(),
  status: z.nativeEnum(ProductStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;

/** Structural rather than importing the Domain `Product` type (Presentation must not import domain/, Ch.9.3). */
interface ProductLike {
  uuid: string;
  companyUuid: string;
  productCode: string;
  name: string;
  description: string | null;
  isStocked: boolean;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toProductResponse(product: ProductLike): ProductResponse {
  return {
    uuid: product.uuid,
    companyUuid: product.companyUuid,
    productCode: product.productCode,
    name: product.name,
    description: product.description,
    isStocked: product.isStocked,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
