import {
  listStockMovementsByWarehouse,
  ListStockMovementsByWarehouseDeps,
} from "./list-stock-movements-by-warehouse.service";
import { buildStockMovement, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListStockMovementsByWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listStockMovementsByWarehouse", () => {
  it("passes tenantId and warehouseUuid through to the repository", async () => {
    const deps = buildDeps();
    const stockMovements = [buildStockMovement()];
    (deps.repository.listStockMovementsByWarehouse as jest.Mock).mockResolvedValue(stockMovements);

    const result = await listStockMovementsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(deps.repository.listStockMovementsByWarehouse).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000200",
    );
    expect(result).toBe(stockMovements);
  });

  it("does not merge results across two different Warehouses — each call is independently scoped", async () => {
    const deps = buildDeps();
    const warehouseAMovements = [buildStockMovement({ destinationWarehouseUuid: "00000000-0000-0000-0000-000000000200" })];
    const warehouseBMovements = [buildStockMovement({ destinationWarehouseUuid: "00000000-0000-0000-0000-000000000300" })];
    (deps.repository.listStockMovementsByWarehouse as jest.Mock).mockImplementation(
      async (_tenantId: bigint, warehouseUuid: string) =>
        warehouseUuid === "00000000-0000-0000-0000-000000000200" ? warehouseAMovements : warehouseBMovements,
    );

    const resultA = await listStockMovementsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );
    const resultB = await listStockMovementsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000300" },
      deps,
    );

    expect(resultA).toBe(warehouseAMovements);
    expect(resultB).toBe(warehouseBMovements);
    expect(resultA).not.toBe(resultB);
  });
});
