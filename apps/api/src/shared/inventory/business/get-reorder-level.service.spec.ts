import { getReorderLevel, GetReorderLevelDeps } from "./get-reorder-level.service";
import { ReorderLevelNotFoundError } from "../domain/errors/inventory.errors";
import { buildReorderLevel, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetReorderLevelDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getReorderLevel", () => {
  it("throws ReorderLevelNotFoundError when the Reorder Level does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getReorderLevel({ tenantId: 1n, reorderLevelUuid: "00000000-0000-0000-0000-000000000900" }, deps),
    ).rejects.toThrow(ReorderLevelNotFoundError);
  });

  it("returns the Reorder Level when found", async () => {
    const deps = buildDeps();
    const reorderLevel = buildReorderLevel();
    (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(reorderLevel);

    const result = await getReorderLevel({ tenantId: 1n, reorderLevelUuid: reorderLevel.uuid }, deps);

    expect(result).toBe(reorderLevel);
    expect(deps.repository.findReorderLevelByUuid).toHaveBeenCalledWith(1n, reorderLevel.uuid);
  });
});
