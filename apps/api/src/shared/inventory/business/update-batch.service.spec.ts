import { updateBatch, UpdateBatchDeps } from "./update-batch.service";
import { BatchNotFoundError, InvalidBatchDateRangeError } from "../domain/errors/inventory.errors";
import { buildBatch, createFakeInventoryRepository } from "./test-support/fixtures";
import { BatchStatus } from "../domain/enums/batch-status.enum";

function buildDeps(): UpdateBatchDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateBatch", () => {
  it("throws BatchNotFoundError when the Batch does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateBatch(
        { tenantId: 1n, batchUuid: "00000000-0000-0000-0000-000000000900", batchNumber: "B2027-06" },
        deps,
      ),
    ).rejects.toThrow(BatchNotFoundError);
    expect(deps.repository.updateBatch).not.toHaveBeenCalled();
  });

  it("updates the Batch's editable fields and returns the repository's result", async () => {
    const deps = buildDeps();
    const batch = buildBatch({ uuid: "00000000-0000-0000-0000-000000000900" });
    (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);
    const updated = buildBatch({ uuid: batch.uuid, batchNumber: "B2027-06" });
    (deps.repository.updateBatch as jest.Mock).mockResolvedValue(updated);

    const result = await updateBatch(
      {
        tenantId: 1n,
        batchUuid: batch.uuid,
        batchNumber: "B2027-06",
        quantity: "500.000000",
        status: BatchStatus.Depleted,
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateBatch).toHaveBeenCalledWith(1n, batch.uuid, {
      batchNumber: "B2027-06",
      manufactureDate: undefined,
      expiryDate: undefined,
      quantity: "500.000000",
      status: BatchStatus.Depleted,
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });

  it("re-validates the date range using the existing manufactureDate when only expiryDate is supplied", async () => {
    const deps = buildDeps();
    const batch = buildBatch({
      uuid: "00000000-0000-0000-0000-000000000900",
      manufactureDate: new Date("2027-06-01T00:00:00.000Z"),
    });
    (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);

    await expect(
      updateBatch(
        { tenantId: 1n, batchUuid: batch.uuid, expiryDate: new Date("2027-01-01T00:00:00.000Z") },
        deps,
      ),
    ).rejects.toThrow(InvalidBatchDateRangeError);
    expect(deps.repository.updateBatch).not.toHaveBeenCalled();
  });

  it("re-validates the date range using the existing expiryDate when only manufactureDate is supplied", async () => {
    const deps = buildDeps();
    const batch = buildBatch({
      uuid: "00000000-0000-0000-0000-000000000900",
      manufactureDate: new Date("2027-01-01T00:00:00.000Z"),
      expiryDate: new Date("2027-06-01T00:00:00.000Z"),
    });
    (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);

    await expect(
      updateBatch(
        { tenantId: 1n, batchUuid: batch.uuid, manufactureDate: new Date("2027-12-01T00:00:00.000Z") },
        deps,
      ),
    ).rejects.toThrow(InvalidBatchDateRangeError);
    expect(deps.repository.updateBatch).not.toHaveBeenCalled();
  });

  it("allows explicitly clearing both dates to null", async () => {
    const deps = buildDeps();
    const batch = buildBatch({
      uuid: "00000000-0000-0000-0000-000000000900",
      manufactureDate: new Date("2027-01-01T00:00:00.000Z"),
      expiryDate: new Date("2027-06-01T00:00:00.000Z"),
    });
    (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);
    (deps.repository.updateBatch as jest.Mock).mockResolvedValue(batch);

    await updateBatch(
      { tenantId: 1n, batchUuid: batch.uuid, manufactureDate: null, expiryDate: null },
      deps,
    );

    expect(deps.repository.updateBatch).toHaveBeenCalledWith(1n, batch.uuid, {
      batchNumber: undefined,
      manufactureDate: null,
      expiryDate: null,
      quantity: undefined,
      status: undefined,
      updatedBy: null,
    });
  });
});
