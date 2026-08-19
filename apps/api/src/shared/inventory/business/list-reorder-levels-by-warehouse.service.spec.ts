import {
  listReorderLevelsByWarehouse,
  ListReorderLevelsByWarehouseDeps,
} from "./list-reorder-levels-by-warehouse.service";
import { buildReorderLevel, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListReorderLevelsByWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listReorderLevelsByWarehouse", () => {
  it("passes tenantId and warehouseUuid through to the repository", async () => {
    const deps = buildDeps();
    const reorderLevels = [buildReorderLevel()];
    (deps.repository.listReorderLevelsByWarehouse as jest.Mock).mockResolvedValue(reorderLevels);

    const result = await listReorderLevelsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(deps.repository.listReorderLevelsByWarehouse).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000200",
    );
    expect(result).toBe(reorderLevels);
  });

  it("does not merge results across two different Warehouses — each call is independently scoped (warehouse isolation)", async () => {
    const deps = buildDeps();
    const warehouseAReorderLevels = [buildReorderLevel({ warehouseUuid: "00000000-0000-0000-0000-000000000200" })];
    const warehouseBReorderLevels = [buildReorderLevel({ warehouseUuid: "00000000-0000-0000-0000-000000000201" })];
    (deps.repository.listReorderLevelsByWarehouse as jest.Mock).mockImplementation(
      async (_tenantId: bigint, warehouseUuid: string) =>
        warehouseUuid === "00000000-0000-0000-0000-000000000200" ? warehouseAReorderLevels : warehouseBReorderLevels,
    );

    const resultA = await listReorderLevelsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );
    const resultB = await listReorderLevelsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000201" },
      deps,
    );

    expect(resultA).toBe(warehouseAReorderLevels);
    expect(resultB).toBe(warehouseBReorderLevels);
    expect(resultA).not.toBe(resultB);
  });
});
