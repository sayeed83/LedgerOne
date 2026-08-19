import { createReorderLevel, CreateReorderLevelDeps, CreateReorderLevelInput } from "./create-reorder-level.service";
import { ReorderLevelAlreadyExistsError, InvalidReorderLevelQuantityError } from "../domain/errors/inventory.errors";
import { buildReorderLevel, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): CreateReorderLevelDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateReorderLevelInput> = {}): CreateReorderLevelInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    warehouseUuid: "00000000-0000-0000-0000-000000000200",
    productId: 1n,
    reorderLevel: "100.000000",
    reorderQuantity: "500.000000",
    ...overrides,
  };
}

describe("createReorderLevel", () => {
  it("throws InvalidReorderLevelQuantityError when reorderLevel is negative", async () => {
    const deps = buildDeps();

    await expect(createReorderLevel(buildInput({ reorderLevel: "-1" }), deps)).rejects.toThrow(
      InvalidReorderLevelQuantityError,
    );
    expect(deps.repository.findReorderLevelByWarehouseAndProduct).not.toHaveBeenCalled();
    expect(deps.repository.createReorderLevel).not.toHaveBeenCalled();
  });

  it("throws InvalidReorderLevelQuantityError when reorderLevel is not numeric", async () => {
    const deps = buildDeps();

    await expect(createReorderLevel(buildInput({ reorderLevel: "abc" }), deps)).rejects.toThrow(
      InvalidReorderLevelQuantityError,
    );
    expect(deps.repository.createReorderLevel).not.toHaveBeenCalled();
  });

  it("allows a reorderLevel of exactly zero (non-negative, not strictly positive)", async () => {
    const deps = buildDeps();
    (deps.repository.findReorderLevelByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
    (deps.repository.createReorderLevel as jest.Mock).mockResolvedValue(buildReorderLevel());

    await createReorderLevel(buildInput({ reorderLevel: "0" }), deps);

    expect(deps.repository.createReorderLevel).toHaveBeenCalled();
  });

  it("throws ReorderLevelAlreadyExistsError when a Reorder Level already exists for the Warehouse/Product pair (ROL-101)", async () => {
    const deps = buildDeps();
    (deps.repository.findReorderLevelByWarehouseAndProduct as jest.Mock).mockResolvedValue(buildReorderLevel());

    await expect(createReorderLevel(buildInput(), deps)).rejects.toThrow(ReorderLevelAlreadyExistsError);
    expect(deps.repository.createReorderLevel).not.toHaveBeenCalled();
  });

  it("creates the Reorder Level when no Reorder Level exists for the Warehouse/Product pair", async () => {
    const deps = buildDeps();
    (deps.repository.findReorderLevelByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
    const created = buildReorderLevel();
    (deps.repository.createReorderLevel as jest.Mock).mockResolvedValue(created);

    const result = await createReorderLevel(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.findReorderLevelByWarehouseAndProduct).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000200",
      1n,
    );
    expect(deps.repository.createReorderLevel).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
      reorderLevel: "100.000000",
      reorderQuantity: "500.000000",
      createdBy: 5n,
    });
    expect(result).toBe(created);
  });

  it("defaults createdBy to null when not supplied", async () => {
    const deps = buildDeps();
    (deps.repository.findReorderLevelByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
    (deps.repository.createReorderLevel as jest.Mock).mockResolvedValue(buildReorderLevel());

    await createReorderLevel(buildInput(), deps);

    expect(deps.repository.createReorderLevel).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ createdBy: null }),
    );
  });
});
