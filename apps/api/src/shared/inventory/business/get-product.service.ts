// Business layer — reads a Product by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md Ch.34.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Product } from "../domain/entities/product.entity";
import { ProductNotFoundError } from "../domain/errors/inventory.errors";

export interface GetProductInput {
  tenantId: bigint;
  productUuid: string;
}

export interface GetProductDeps {
  repository: IInventoryRepository;
}

export async function getProduct(input: GetProductInput, deps: GetProductDeps): Promise<Product> {
  const product = await deps.repository.findProductByUuid(input.tenantId, input.productUuid);
  if (!product) {
    throw new ProductNotFoundError(input.productUuid);
  }
  return product;
}
