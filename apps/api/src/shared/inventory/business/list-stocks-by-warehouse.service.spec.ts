import { listStocksByWarehouse, ListStocksByWarehouseDeps } from "./list-stocks-by-warehouse.service";
import { buildStock, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListStocksByWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listStocksByWarehouse", () => {
  it("passes tenantId and warehouseUuid through to the repository", async () => {
    const deps = buildDeps();
    const stocks = [buildStock()];
    (deps.repository.listStocksByWarehouse as jest.Mock).mockResolvedValue(stocks);

    const result = await listStocksByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(deps.repository.listStocksByWarehouse).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000200");
    expect(result).toBe(stocks);
  });

  it("does not merge results across two different Warehouses — each call is independently scoped", async () => {
    const deps = buildDeps();
    const warehouseAStocks = [buildStock({ warehouseUuid: "00000000-0000-0000-0000-000000000200" })];
    const warehouseBStocks = [buildStock({ warehouseUuid: "00000000-0000-0000-0000-000000000300" })];
    (deps.repository.listStocksByWarehouse as jest.Mock).mockImplementation(
      async (_tenantId: bigint, warehouseUuid: string) =>
        warehouseUuid === "00000000-0000-0000-0000-000000000200" ? warehouseAStocks : warehouseBStocks,
    );

    const resultA = await listStocksByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );
    const resultB = await listStocksByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000300" },
      deps,
    );

    expect(resultA).toBe(warehouseAStocks);
    expect(resultB).toBe(warehouseBStocks);
    expect(resultA).not.toBe(resultB);
  });
});
