import { getBatch, GetBatchDeps } from "./get-batch.service";
import { BatchNotFoundError } from "../domain/errors/inventory.errors";
import { buildBatch, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetBatchDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getBatch", () => {
  it("throws BatchNotFoundError when the Batch does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getBatch({ tenantId: 1n, batchUuid: "00000000-0000-0000-0000-000000000900" }, deps),
    ).rejects.toThrow(BatchNotFoundError);
  });

  it("returns the Batch when found", async () => {
    const deps = buildDeps();
    const batch = buildBatch();
    (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);

    const result = await getBatch({ tenantId: 1n, batchUuid: batch.uuid }, deps);

    expect(result).toBe(batch);
    expect(deps.repository.findBatchByUuid).toHaveBeenCalledWith(1n, batch.uuid);
  });
});
