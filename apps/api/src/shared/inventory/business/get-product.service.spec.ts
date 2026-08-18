import { getProduct, GetProductDeps } from "./get-product.service";
import { ProductNotFoundError } from "../domain/errors/inventory.errors";
import { buildProduct, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetProductDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getProduct", () => {
  it("throws ProductNotFoundError when the Product does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getProduct({ tenantId: 1n, productUuid: "00000000-0000-0000-0000-000000000600" }, deps),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it("returns the Product when found", async () => {
    const deps = buildDeps();
    const product = buildProduct();
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);

    const result = await getProduct({ tenantId: 1n, productUuid: product.uuid }, deps);

    expect(result).toBe(product);
    expect(deps.repository.findProductByUuid).toHaveBeenCalledWith(1n, product.uuid);
  });
});
