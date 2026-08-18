import { getProductCategory, GetProductCategoryDeps } from "./get-product-category.service";
import { ProductCategoryNotFoundError } from "../domain/errors/inventory.errors";
import { buildProductCategory, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetProductCategoryDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getProductCategory", () => {
  it("throws ProductCategoryNotFoundError when the Product Category does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getProductCategory({ tenantId: 1n, productCategoryUuid: "00000000-0000-0000-0000-000000000600" }, deps),
    ).rejects.toThrow(ProductCategoryNotFoundError);
  });

  it("returns the Product Category when found", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory();
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);

    const result = await getProductCategory({ tenantId: 1n, productCategoryUuid: productCategory.uuid }, deps);

    expect(result).toBe(productCategory);
  });
});
