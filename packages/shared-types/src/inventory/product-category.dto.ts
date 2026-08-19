// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/product-category.response.dto.ts
// and dto/requests/{create-product-category.dto.ts,update-product-category.dto.ts}.
// Flagged known backend gap (mirrors Unit's own identical, already-
// documented gap): the response does not echo back `parentProductCategoryUuid`
// — screens cannot render/prefill a Product Category's own parent from this
// shape alone.
export interface ProductCategoryResponseDto {
  uuid: string;
  companyUuid: string;
  name: string;
  defaultTaxGroupUuid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCategoryRequestDto {
  companyUuid: string;
  name: string;
  parentProductCategoryUuid?: string;
  defaultTaxGroupUuid?: string;
}

export interface UpdateProductCategoryRequestDto {
  name?: string;
  parentProductCategoryUuid?: string | null;
  defaultTaxGroupUuid?: string | null;
}
