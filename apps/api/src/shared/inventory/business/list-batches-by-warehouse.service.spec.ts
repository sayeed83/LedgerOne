import { listBatchesByWarehouse, ListBatchesByWarehouseDeps } from "./list-batches-by-warehouse.service";
import { buildBatch, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListBatchesByWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listBatchesByWarehouse", () => {
  it("passes tenantId and warehouseUuid through to the repository", async () => {
    const deps = buildDeps();
    const batches = [buildBatch()];
    (deps.repository.listBatchesByWarehouse as jest.Mock).mockResolvedValue(batches);

    const result = await listBatchesByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(deps.repository.listBatchesByWarehouse).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000200",
    );
    expect(result).toBe(batches);
  });

  it("does not merge results across two different Warehouses — each call is independently scoped (warehouse isolation)", async () => {
    const deps = buildDeps();
    const warehouseABatches = [buildBatch({ warehouseUuid: "00000000-0000-0000-0000-000000000200" })];
    const warehouseBBatches = [buildBatch({ warehouseUuid: "00000000-0000-0000-0000-000000000201" })];
    (deps.repository.listBatchesByWarehouse as jest.Mock).mockImplementation(
      async (_tenantId: bigint, warehouseUuid: string) =>
        warehouseUuid === "00000000-0000-0000-0000-000000000200" ? warehouseABatches : warehouseBBatches,
    );

    const resultA = await listBatchesByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );
    const resultB = await listBatchesByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000201" },
      deps,
    );

    expect(resultA).toBe(warehouseABatches);
    expect(resultB).toBe(warehouseBBatches);
    expect(resultA).not.toBe(resultB);
  });
});
