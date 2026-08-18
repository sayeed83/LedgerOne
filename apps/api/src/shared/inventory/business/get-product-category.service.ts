// Business layer — reads a Product Category by its external identifier,
// scoped to the supplied Tenant (00_BUSINESS_RULES.md Ch.35.1). Never
// resolves by the internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers
// outside this module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ProductCategory } from "../domain/entities/product-category.entity";
import { ProductCategoryNotFoundError } from "../domain/errors/inventory.errors";

export interface GetProductCategoryInput {
  tenantId: bigint;
  productCategoryUuid: string;
}

export interface GetProductCategoryDeps {
  repository: IInventoryRepository;
}

export async function getProductCategory(
  input: GetProductCategoryInput,
  deps: GetProductCategoryDeps,
): Promise<ProductCategory> {
  const productCategory = await deps.repository.findProductCategoryByUuid(input.tenantId, input.productCategoryUuid);
  if (!productCategory) {
    throw new ProductCategoryNotFoundError(input.productCategoryUuid);
  }
  return productCategory;
}
