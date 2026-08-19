import { createBatch, CreateBatchDeps, CreateBatchInput } from "./create-batch.service";
import { InvalidBatchDateRangeError } from "../domain/errors/inventory.errors";
import { buildBatch, createFakeInventoryRepository } from "./test-support/fixtures";
import { BatchStatus } from "../domain/enums/batch-status.enum";

function buildDeps(): CreateBatchDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateBatchInput> = {}): CreateBatchInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    productId: 1n,
    warehouseUuid: "00000000-0000-0000-0000-000000000200",
    batchNumber: "B2027-03",
    ...overrides,
  };
}

describe("createBatch", () => {
  it("creates a Batch with no manufacture/expiry date supplied", async () => {
    const deps = buildDeps();
    (deps.repository.createBatch as jest.Mock).mockResolvedValue(buildBatch());

    await createBatch(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.createBatch).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      productId: 1n,
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      batchNumber: "B2027-03",
      manufactureDate: null,
      expiryDate: null,
      quantity: undefined,
      status: undefined,
      createdBy: 5n,
    });
  });

  it("creates a Batch when the manufacture date is before the expiry date", async () => {
    const deps = buildDeps();
    (deps.repository.createBatch as jest.Mock).mockResolvedValue(buildBatch());
    const manufactureDate = new Date("2027-01-01T00:00:00.000Z");
    const expiryDate = new Date("2027-12-01T00:00:00.000Z");

    await createBatch(
      buildInput({ manufactureDate, expiryDate, quantity: "1000.000000", status: BatchStatus.Active }),
      deps,
    );

    expect(deps.repository.createBatch).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      productId: 1n,
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      batchNumber: "B2027-03",
      manufactureDate,
      expiryDate,
      quantity: "1000.000000",
      status: BatchStatus.Active,
      createdBy: null,
    });
  });

  it("creates a Batch when the manufacture date equals the expiry date", async () => {
    const deps = buildDeps();
    (deps.repository.createBatch as jest.Mock).mockResolvedValue(buildBatch());
    const sameDate = new Date("2027-06-01T00:00:00.000Z");

    await createBatch(buildInput({ manufactureDate: sameDate, expiryDate: sameDate }), deps);

    expect(deps.repository.createBatch).toHaveBeenCalled();
  });

  it("throws InvalidBatchDateRangeError when the manufacture date is after the expiry date", async () => {
    const deps = buildDeps();
    const manufactureDate = new Date("2027-12-01T00:00:00.000Z");
    const expiryDate = new Date("2027-01-01T00:00:00.000Z");

    await expect(createBatch(buildInput({ manufactureDate, expiryDate }), deps)).rejects.toThrow(
      InvalidBatchDateRangeError,
    );
    expect(deps.repository.createBatch).not.toHaveBeenCalled();
  });
});
