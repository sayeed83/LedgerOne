import {
  createStockMovement,
  CreateStockMovementDeps,
  CreateStockMovementInput,
} from "./create-stock-movement.service";
import { StockMovementMissingRequiredWarehouseError } from "../domain/errors/inventory.errors";
import { buildStockMovement, createFakeInventoryRepository } from "./test-support/fixtures";
import { StockMovementType } from "../domain/enums/stock-movement-type.enum";

function buildDeps(): CreateStockMovementDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateStockMovementInput> = {}): CreateStockMovementInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    productId: 1n,
    destinationWarehouseUuid: "00000000-0000-0000-0000-000000000200",
    movementType: StockMovementType.Receipt,
    quantity: "1.000000",
    ...overrides,
  };
}

describe("createStockMovement", () => {
  it("creates the Stock Movement and returns the repository's result", async () => {
    const deps = buildDeps();
    const created = buildStockMovement();
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);

    const result = await createStockMovement(buildInput(), deps);

    expect(result).toBe(created);
  });

  it("passes the expected payload through to the repository", async () => {
    const deps = buildDeps();
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(buildStockMovement());

    await createStockMovement(
      buildInput({
        referenceType: "GOODS_RECEIPT",
        referenceUuid: "00000000-0000-0000-0000-000000000300",
        createdBy: 5n,
      }),
      deps,
    );

    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      productId: 1n,
      sourceWarehouseUuid: null,
      destinationWarehouseUuid: "00000000-0000-0000-0000-000000000200",
      movementType: StockMovementType.Receipt,
      quantity: "1.000000",
      referenceType: "GOODS_RECEIPT",
      referenceUuid: "00000000-0000-0000-0000-000000000300",
      createdBy: 5n,
    });
  });

  it("defaults sourceWarehouseUuid/referenceType/referenceUuid/createdBy to null when omitted", async () => {
    const deps = buildDeps();
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(buildStockMovement());

    await createStockMovement(buildInput(), deps);

    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      productId: 1n,
      sourceWarehouseUuid: null,
      destinationWarehouseUuid: "00000000-0000-0000-0000-000000000200",
      movementType: StockMovementType.Receipt,
      quantity: "1.000000",
      referenceType: null,
      referenceUuid: null,
      createdBy: null,
    });
  });

  it("throws StockMovementMissingRequiredWarehouseError for a RECEIPT with no destinationWarehouseUuid", async () => {
    const deps = buildDeps();

    await expect(
      createStockMovement(buildInput({ destinationWarehouseUuid: null }), deps),
    ).rejects.toThrow(StockMovementMissingRequiredWarehouseError);
    expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
  });

  it("throws StockMovementMissingRequiredWarehouseError for an ISSUE with no sourceWarehouseUuid", async () => {
    const deps = buildDeps();

    await expect(
      createStockMovement(
        buildInput({ movementType: StockMovementType.Issue, destinationWarehouseUuid: undefined, sourceWarehouseUuid: null }),
        deps,
      ),
    ).rejects.toThrow(StockMovementMissingRequiredWarehouseError);
    expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
  });

  it("creates an ISSUE when sourceWarehouseUuid is supplied", async () => {
    const deps = buildDeps();
    const created = buildStockMovement({ movementType: StockMovementType.Issue });
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);

    const result = await createStockMovement(
      buildInput({
        movementType: StockMovementType.Issue,
        destinationWarehouseUuid: undefined,
        sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200",
      }),
      deps,
    );

    expect(result).toBe(created);
    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({
        sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200",
        destinationWarehouseUuid: null,
      }),
    );
  });

  it("throws StockMovementMissingRequiredWarehouseError for a TRANSFER missing the destination Warehouse", async () => {
    const deps = buildDeps();

    await expect(
      createStockMovement(
        buildInput({
          movementType: StockMovementType.Transfer,
          sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200",
          destinationWarehouseUuid: undefined,
        }),
        deps,
      ),
    ).rejects.toThrow(StockMovementMissingRequiredWarehouseError);
    expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
  });

  it("throws StockMovementMissingRequiredWarehouseError for a TRANSFER missing the source Warehouse", async () => {
    const deps = buildDeps();

    await expect(
      createStockMovement(
        buildInput({
          movementType: StockMovementType.Transfer,
          sourceWarehouseUuid: undefined,
          destinationWarehouseUuid: "00000000-0000-0000-0000-000000000300",
        }),
        deps,
      ),
    ).rejects.toThrow(StockMovementMissingRequiredWarehouseError);
    expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
  });

  it("creates a TRANSFER when both source and destination Warehouses are supplied (STM-003)", async () => {
    const deps = buildDeps();
    const created = buildStockMovement({ movementType: StockMovementType.Transfer });
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);

    const result = await createStockMovement(
      buildInput({
        movementType: StockMovementType.Transfer,
        sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200",
        destinationWarehouseUuid: "00000000-0000-0000-0000-000000000300",
      }),
      deps,
    );

    expect(result).toBe(created);
    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({
        sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200",
        destinationWarehouseUuid: "00000000-0000-0000-0000-000000000300",
      }),
    );
  });

  it("creates an ADJUSTMENT with no Warehouse supplied at all — Ch.39.8 states no requirement for this type", async () => {
    const deps = buildDeps();
    const created = buildStockMovement({ movementType: StockMovementType.Adjustment });
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);

    const result = await createStockMovement(
      buildInput({
        movementType: StockMovementType.Adjustment,
        sourceWarehouseUuid: undefined,
        destinationWarehouseUuid: undefined,
      }),
      deps,
    );

    expect(result).toBe(created);
    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ sourceWarehouseUuid: null, destinationWarehouseUuid: null }),
    );
  });
});
