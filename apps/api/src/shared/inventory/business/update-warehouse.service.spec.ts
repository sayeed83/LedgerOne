import { updateWarehouse, UpdateWarehouseDeps } from "./update-warehouse.service";
import { WarehouseNotFoundError, DuplicateWarehouseCodeError, DuplicateWarehouseNameError } from "../domain/errors/inventory.errors";
import { buildWarehouse, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): UpdateWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateWarehouse", () => {
  it("throws WarehouseNotFoundError when the Warehouse does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateWarehouse({ tenantId: 1n, warehouseUuid: "00000000-0000-0000-0000-000000000900", name: "Revised" }, deps),
    ).rejects.toThrow(WarehouseNotFoundError);
    expect(deps.repository.updateWarehouse).not.toHaveBeenCalled();
  });

  it("does not re-check code uniqueness when warehouseCode is unchanged", async () => {
    const deps = buildDeps();
    const warehouse = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000900", warehouseCode: "WH-001" });
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
    (deps.repository.updateWarehouse as jest.Mock).mockResolvedValue(warehouse);

    await updateWarehouse({ tenantId: 1n, warehouseUuid: warehouse.uuid, warehouseCode: "WH-001" }, deps);

    expect(deps.repository.findWarehouseByCode).not.toHaveBeenCalled();
    expect(deps.repository.updateWarehouse).toHaveBeenCalled();
  });

  it("does not re-check name uniqueness when name is unchanged", async () => {
    const deps = buildDeps();
    const warehouse = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000900", name: "Head Office Warehouse" });
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
    (deps.repository.updateWarehouse as jest.Mock).mockResolvedValue(warehouse);

    await updateWarehouse({ tenantId: 1n, warehouseUuid: warehouse.uuid, name: "Head Office Warehouse" }, deps);

    expect(deps.repository.listWarehousesByBranch).not.toHaveBeenCalled();
    expect(deps.repository.updateWarehouse).toHaveBeenCalled();
  });

  it("throws DuplicateWarehouseCodeError when renaming the code to one another Warehouse in the Branch already uses", async () => {
    const deps = buildDeps();
    const warehouse = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000900", warehouseCode: "WH-001" });
    const other = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000901", warehouseCode: "WH-002" });
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
    (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(other);

    await expect(
      updateWarehouse({ tenantId: 1n, warehouseUuid: warehouse.uuid, warehouseCode: "WH-002" }, deps),
    ).rejects.toThrow(DuplicateWarehouseCodeError);
    expect(deps.repository.updateWarehouse).not.toHaveBeenCalled();
  });

  it("throws DuplicateWarehouseNameError when renaming to a name another Warehouse in the Branch already uses", async () => {
    const deps = buildDeps();
    const warehouse = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000900", name: "Head Office Warehouse" });
    const other = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000901", name: "Regional Store Warehouse" });
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
    (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([warehouse, other]);

    await expect(
      updateWarehouse({ tenantId: 1n, warehouseUuid: warehouse.uuid, name: "Regional Store Warehouse" }, deps),
    ).rejects.toThrow(DuplicateWarehouseNameError);
    expect(deps.repository.updateWarehouse).not.toHaveBeenCalled();
  });

  it("updates the Warehouse with a non-conflicting new code and name", async () => {
    const deps = buildDeps();
    const warehouse = buildWarehouse({
      uuid: "00000000-0000-0000-0000-000000000900",
      warehouseCode: "WH-001",
      name: "Head Office Warehouse",
    });
    (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
    (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([warehouse]);
    const updated = buildWarehouse({ uuid: warehouse.uuid, warehouseCode: "WH-002", name: "Renamed Warehouse" });
    (deps.repository.updateWarehouse as jest.Mock).mockResolvedValue(updated);

    const result = await updateWarehouse(
      {
        tenantId: 1n,
        warehouseUuid: warehouse.uuid,
        warehouseCode: "WH-002",
        name: "Renamed Warehouse",
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateWarehouse).toHaveBeenCalledWith(1n, warehouse.uuid, {
      warehouseCode: "WH-002",
      name: "Renamed Warehouse",
      description: undefined,
      status: undefined,
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });
});
