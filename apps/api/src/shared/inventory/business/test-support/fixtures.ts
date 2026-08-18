// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { ProductCategory } from "../../domain/entities/product-category.entity";
import { IInventoryRepository } from "../../domain/interfaces/inventory-repository.interface";

export function buildProductCategory(overrides: Partial<ProductCategory> = {}): ProductCategory {
  const base = new ProductCategory(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "Hardware",
    null,
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(ProductCategory.prototype), base, overrides) as ProductCategory;
}

export function createFakeInventoryRepository(): jest.Mocked<IInventoryRepository> {
  return {
    createProductCategory: jest.fn(),
    findProductCategoryByUuid: jest.fn(),
    listProductCategories: jest.fn(),
    updateProductCategory: jest.fn(),
  };
}
