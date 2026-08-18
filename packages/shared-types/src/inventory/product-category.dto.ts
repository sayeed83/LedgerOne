// Minimal, read-only mirror of
// apps/api/src/shared/inventory/presentation/dto/responses/product-category.response.dto.ts.
// Product Category has no frontend of its own yet (create/edit/list
// screens, routes) — this type exists only so Product's own
// ProductCategorySelect can list Product Categories for a Company; it is
// not part of a Product Category frontend implementation.
export interface ProductCategoryResponseDto {
  uuid: string;
  companyUuid: string;
  name: string;
  defaultTaxGroupUuid: string | null;
  createdAt: string;
  updatedAt: string;
}
