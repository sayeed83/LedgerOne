import {
  createStockMovement,
  CreateStockMovementDeps,
  CreateStockMovementInput,
} from "./create-stock-movement.service";
import { StockMovementMissingRequiredWarehouseError } from "../domain/errors/inventory.errors";
import {
  buildStock,
  buildStockMovement,
  createFakeInventoryRepository,
  createFakeTransactionRunner,
} from "./test-support/fixtures";
import { StockMovementType } from "../domain/enums/stock-movement-type.enum";

function buildDeps(): CreateStockMovementDeps {
  return { repository: createFakeInventoryRepository(), transactionRunner: createFakeTransactionRunner() };
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
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

    const result = await createStockMovement(buildInput(), deps);

    expect(result).toBe(created);
  });

  it("runs the whole use case inside one transaction", async () => {
    const deps = buildDeps();
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(buildStockMovement());
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

    await createStockMovement(buildInput(), deps);

    expect(deps.transactionRunner.run).toHaveBeenCalledTimes(1);
  });

  it("passes the expected payload, plus the transaction handle, through to the repository", async () => {
    const deps = buildDeps();
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(buildStockMovement());
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

    await createStockMovement(
      buildInput({
        referenceType: "GOODS_RECEIPT",
        referenceUuid: "00000000-0000-0000-0000-000000000300",
        createdBy: 5n,
      }),
      deps,
    );

    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(
      1n,
      {
        companyUuid: "00000000-0000-0000-0000-000000000100",
        productId: 1n,
        sourceWarehouseUuid: null,
        destinationWarehouseUuid: "00000000-0000-0000-0000-000000000200",
        movementType: StockMovementType.Receipt,
        quantity: "1.000000",
        referenceType: "GOODS_RECEIPT",
        referenceUuid: "00000000-0000-0000-0000-000000000300",
        createdBy: 5n,
      },
      "fake-tx",
    );
  });

  it("defaults sourceWarehouseUuid/referenceType/referenceUuid/createdBy to null when omitted", async () => {
    const deps = buildDeps();
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(buildStockMovement());
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

    await createStockMovement(buildInput(), deps);

    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(
      1n,
      {
        companyUuid: "00000000-0000-0000-0000-000000000100",
        productId: 1n,
        sourceWarehouseUuid: null,
        destinationWarehouseUuid: "00000000-0000-0000-0000-000000000200",
        movementType: StockMovementType.Receipt,
        quantity: "1.000000",
        referenceType: null,
        referenceUuid: null,
        createdBy: null,
      },
      "fake-tx",
    );
  });

  it("throws StockMovementMissingRequiredWarehouseError for a RECEIPT with no destinationWarehouseUuid, and never opens a transaction", async () => {
    const deps = buildDeps();

    await expect(
      createStockMovement(buildInput({ destinationWarehouseUuid: null }), deps),
    ).rejects.toThrow(StockMovementMissingRequiredWarehouseError);
    expect(deps.transactionRunner.run).not.toHaveBeenCalled();
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
    expect(deps.transactionRunner.run).not.toHaveBeenCalled();
    expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
  });

  it("creates an ISSUE and decreases the source Warehouse's Stock by the movement quantity (STM-001)", async () => {
    const deps = buildDeps();
    const created = buildStockMovement({ movementType: StockMovementType.Issue, quantity: "5.000000" });
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

    const result = await createStockMovement(
      buildInput({
        movementType: StockMovementType.Issue,
        destinationWarehouseUuid: undefined,
        sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200",
        quantity: "5.000000",
      }),
      deps,
    );

    expect(result).toBe(created);
    expect(deps.repository.createStockMovement).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200", destinationWarehouseUuid: null }),
      "fake-tx",
    );
    expect(deps.repository.applyStockQuantityDelta).toHaveBeenCalledTimes(1);
    expect(deps.repository.applyStockQuantityDelta).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000100",
      "00000000-0000-0000-0000-000000000200",
      1n,
      "-5.000000",
      "fake-tx",
    );
  });

  it("creates a RECEIPT and increases the destination Warehouse's Stock by the movement quantity (STM-001)", async () => {
    const deps = buildDeps();
    const created = buildStockMovement({ movementType: StockMovementType.Receipt, quantity: "10.000000" });
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

    const result = await createStockMovement(buildInput({ quantity: "10.000000" }), deps);

    expect(result).toBe(created);
    expect(deps.repository.applyStockQuantityDelta).toHaveBeenCalledTimes(1);
    expect(deps.repository.applyStockQuantityDelta).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000100",
      "00000000-0000-0000-0000-000000000200",
      1n,
      "10.000000",
      "fake-tx",
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

  it("creates a TRANSFER and applies both the source decrease and destination increase atomically (STM-003)", async () => {
    const deps = buildDeps();
    const created = buildStockMovement({ movementType: StockMovementType.Transfer, quantity: "50.000000" });
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

    const result = await createStockMovement(
      buildInput({
        movementType: StockMovementType.Transfer,
        sourceWarehouseUuid: "00000000-0000-0000-0000-000000000200",
        destinationWarehouseUuid: "00000000-0000-0000-0000-000000000300",
        quantity: "50.000000",
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
      "fake-tx",
    );
    expect(deps.repository.applyStockQuantityDelta).toHaveBeenCalledTimes(2);
    expect(deps.repository.applyStockQuantityDelta).toHaveBeenNthCalledWith(
      1,
      1n,
      "00000000-0000-0000-0000-000000000100",
      "00000000-0000-0000-0000-000000000200",
      1n,
      "-50.000000",
      "fake-tx",
    );
    expect(deps.repository.applyStockQuantityDelta).toHaveBeenNthCalledWith(
      2,
      1n,
      "00000000-0000-0000-0000-000000000100",
      "00000000-0000-0000-0000-000000000300",
      1n,
      "50.000000",
      "fake-tx",
    );
  });

  it("creates an ADJUSTMENT with no Warehouse supplied at all — Ch.39.8 states no requirement for this type — and applies no Stock delta", async () => {
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
      "fake-tx",
    );
    expect(deps.repository.applyStockQuantityDelta).not.toHaveBeenCalled();
  });

  it("propagates a Stock-update failure and rolls back (never returns a movement)", async () => {
    const deps = buildDeps();
    (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(buildStockMovement());
    (deps.repository.applyStockQuantityDelta as jest.Mock).mockRejectedValue(new Error("stock update failed"));

    await expect(createStockMovement(buildInput(), deps)).rejects.toThrow("stock update failed");
  });
});
