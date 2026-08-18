import { getWarehouse, GetWarehouseDeps } from "./get-warehouse.service";
import { WarehouseNotFoundError } from "../domain/errors/inventory.errors";
import { buildWarehouse, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getWarehouse", () => {
  it("throws WarehouseNotFoundError when the Warehouse does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getWarehouse({ tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000900" }, deps),
    ).rejects.toThrow(WarehouseNotFoundError);
  });

  it("returns the Warehouse when found", async () => {
    const deps = buildDeps();
    const warehouse = buildWarehouse();
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);

    const result = await getWarehouse({ tenantId: 1n, warehouseUuid: warehouse.uuid }, deps);

    expect(result).toBe(warehouse);
    expect(deps.repository.findWarehouseByUuid).toHaveBeenCalledWith(1n, warehouse.uuid);
  });
});
