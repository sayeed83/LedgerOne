// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/product.response.dto.ts
// and dto/requests/{create-product.dto.ts,update-product.dto.ts}. Flagged
// known backend gap (mirrors Unit's/Account's own identical, already-
// documented gap): the response does not echo back `productCategoryUuid`/
// `unitUuid` — screens cannot render/prefill a Product's own Product
// Category or Unit from this shape alone.
export enum ProductStatus {
  Draft = "DRAFT",
  Active = "ACTIVE",
  Discontinued = "DISCONTINUED",
}

export interface ProductResponseDto {
  uuid: string;
  companyUuid: string;
  productCode: string;
  name: string;
  description: string | null;
  isStocked: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequestDto {
  companyUuid: string;
  productCode: string;
  name: string;
  description?: string;
  productCategoryUuid: string;
  unitUuid?: string;
  isStocked: boolean;
  status?: ProductStatus;
}

export interface UpdateProductRequestDto {
  productCode?: string;
  name?: string;
  description?: string | null;
  productCategoryUuid?: string;
  unitUuid?: string | null;
  isStocked?: boolean;
  status?: ProductStatus;
}
