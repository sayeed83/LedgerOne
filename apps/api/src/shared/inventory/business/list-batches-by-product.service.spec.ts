import { listBatchesByProduct, ListBatchesByProductDeps } from "./list-batches-by-product.service";
import { buildBatch, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListBatchesByProductDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listBatchesByProduct", () => {
  it("passes tenantId and productId through to the repository", async () => {
    const deps = buildDeps();
    const batches = [buildBatch()];
    (deps.repository.listBatchesByProduct as jest.Mock).mockResolvedValue(batches);

    const result = await listBatchesByProduct({ tenantId: 1n, productId: 1n }, deps);

    expect(deps.repository.listBatchesByProduct).toHaveBeenCalledWith(1n, 1n);
    expect(result).toBe(batches);
  });

  it("does not merge results across two different Products — each call is independently scoped (product isolation)", async () => {
    const deps = buildDeps();
    const productABatches = [buildBatch({ productId: 1n })];
    const productBBatches = [buildBatch({ productId: 2n })];
    (deps.repository.listBatchesByProduct as jest.Mock).mockImplementation(async (_tenantId: bigint, productId: bigint) =>
      productId === 1n ? productABatches : productBBatches,
    );

    const resultA = await listBatchesByProduct({ tenantId: 1n, productId: 1n }, deps);
    const resultB = await listBatchesByProduct({ tenantId: 1n, productId: 2n }, deps);

    expect(resultA).toBe(productABatches);
    expect(resultB).toBe(productBBatches);
    expect(resultA).not.toBe(resultB);
  });
});
