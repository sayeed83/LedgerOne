import { z } from "zod";

// Never the `ProductCategory` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003) — only `uuid` (and the cross-module
// `companyUuid`/`defaultTaxGroupUuid` references, already stored as uuids)
// cross the API boundary. `parentProductCategoryId` is DELIBERATELY OMITTED
// entirely rather than resolved to its parent's `uuid` — mirroring
// Accounting's Account Group response DTO's own documented choice to omit
// `parentAccountGroupId` rather than pay an extra lookup per row (itself
// carried forward from Tax Rule's/Exchange Rate's identical reasoning) — a
// carried-forward Handbook Deviation/known gap, not a new one introduced
// here.
export const productCategoryResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  name: z.string(),
  defaultTaxGroupUuid: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductCategoryResponse = z.infer<typeof productCategoryResponseSchema>;

/** Structural rather than importing the Domain `ProductCategory` type (Presentation must not import domain/, Ch.9.3). */
interface ProductCategoryLike {
  uuid: string;
  companyUuid: string;
  name: string;
  defaultTaxGroupUuid: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toProductCategoryResponse(productCategory: ProductCategoryLike): ProductCategoryResponse {
  return {
    uuid: productCategory.uuid,
    companyUuid: productCategory.companyUuid,
    name: productCategory.name,
    defaultTaxGroupUuid: productCategory.defaultTaxGroupUuid,
    createdAt: productCategory.createdAt,
    updatedAt: productCategory.updatedAt,
  };
}
