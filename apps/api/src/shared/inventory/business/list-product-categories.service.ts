// Business layer — lists Product Categories within a Tenant, optionally
// narrowed to a single Company (00_BUSINESS_RULES.md Ch.35.1).
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ProductCategory } from "../domain/entities/product-category.entity";

export interface ListProductCategoriesInput {
  tenantId: bigint;
  companyUuid?: string;
}

export interface ListProductCategoriesDeps {
  repository: IInventoryRepository;
}

export async function listProductCategories(
  input: ListProductCategoriesInput,
  deps: ListProductCategoriesDeps,
): Promise<ProductCategory[]> {
  return deps.repository.listProductCategories(input.tenantId, input.companyUuid);
}
