import {
  listInventoryAdjustmentsByWarehouse,
  ListInventoryAdjustmentsByWarehouseDeps,
} from "./list-inventory-adjustments-by-warehouse.service";
import { buildInventoryAdjustment, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListInventoryAdjustmentsByWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listInventoryAdjustmentsByWarehouse", () => {
  it("passes tenantId and warehouseUuid through to the repository", async () => {
    const deps = buildDeps();
    const inventoryAdjustments = [buildInventoryAdjustment()];
    (deps.repository.listInventoryAdjustmentsByWarehouse as jest.Mock).mockResolvedValue(inventoryAdjustments);

    const result = await listInventoryAdjustmentsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(deps.repository.listInventoryAdjustmentsByWarehouse).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000200",
    );
    expect(result).toBe(inventoryAdjustments);
  });

  it("does not merge results across two different Warehouses — each call is independently scoped (warehouse isolation)", async () => {
    const deps = buildDeps();
    const warehouseAAdjustments = [
      buildInventoryAdjustment({ warehouseUuid: "00000000-0000-0000-0000-000000000200" }),
    ];
    const warehouseBAdjustments = [
      buildInventoryAdjustment({ warehouseUuid: "00000000-0000-0000-0000-000000000201" }),
    ];
    (deps.repository.listInventoryAdjustmentsByWarehouse as jest.Mock).mockImplementation(
      async (_tenantId: bigint, warehouseUuid: string) =>
        warehouseUuid === "00000000-0000-0000-0000-000000000200" ? warehouseAAdjustments : warehouseBAdjustments,
    );

    const resultA = await listInventoryAdjustmentsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );
    const resultB = await listInventoryAdjustmentsByWarehouse(
      { tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000201" },
      deps,
    );

    expect(resultA).toBe(warehouseAAdjustments);
    expect(resultB).toBe(warehouseBAdjustments);
    expect(resultA).not.toBe(resultB);
  });
});
