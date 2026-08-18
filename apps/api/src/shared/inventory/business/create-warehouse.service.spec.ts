import { createWarehouse, CreateWarehouseDeps, CreateWarehouseInput } from "./create-warehouse.service";
import { DuplicateWarehouseCodeError, DuplicateWarehouseNameError } from "../domain/errors/inventory.errors";
import { buildWarehouse, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): CreateWarehouseDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateWarehouseInput> = {}): CreateWarehouseInput {
  return {
    tenantId: 1n,
    branchUuid: "00000000-0000-0000-0000-000000000200",
    warehouseCode: "WH-001",
    name: "Head Office Warehouse",
    ...overrides,
  };
}

describe("createWarehouse", () => {
  it("throws DuplicateWarehouseCodeError when another Warehouse in the Branch already uses the code", async () => {
    const deps = buildDeps();
    (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(buildWarehouse());

    await expect(createWarehouse(buildInput(), deps)).rejects.toThrow(DuplicateWarehouseCodeError);
    expect(deps.repository.listWarehousesByBranch).not.toHaveBeenCalled();
    expect(deps.repository.createWarehouse).not.toHaveBeenCalled();
  });

  it("throws DuplicateWarehouseNameError when another Warehouse in the Branch already uses the name", async () => {
    const deps = buildDeps();
    (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([
      buildWarehouse({ name: "Head Office Warehouse" }),
    ]);

    await expect(createWarehouse(buildInput(), deps)).rejects.toThrow(DuplicateWarehouseNameError);
    expect(deps.repository.createWarehouse).not.toHaveBeenCalled();
  });

  it("creates the Warehouse when the code and name are both available in the Branch", async () => {
    const deps = buildDeps();
    (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([
      buildWarehouse({ name: "Regional Store Warehouse" }),
    ]);
    const created = buildWarehouse();
    (deps.repository.createWarehouse as jest.Mock).mockResolvedValue(created);

    const result = await createWarehouse(buildInput({ description: "Main distribution point", createdBy: 5n }), deps);

    expect(deps.repository.createWarehouse).toHaveBeenCalledWith(1n, {
      branchUuid: "00000000-0000-0000-0000-000000000200",
      warehouseCode: "WH-001",
      name: "Head Office Warehouse",
      description: "Main distribution point",
      status: undefined,
      createdBy: 5n,
    });
    expect(result).toBe(created);
  });
});
