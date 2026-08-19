import { updateReorderLevel, UpdateReorderLevelDeps } from "./update-reorder-level.service";
import { ReorderLevelNotFoundError, InvalidReorderLevelQuantityError } from "../domain/errors/inventory.errors";
import { buildReorderLevel, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): UpdateReorderLevelDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateReorderLevel", () => {
  it("throws ReorderLevelNotFoundError when the Reorder Level does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateReorderLevel(
        { tenantId: 1n, reorderLevelUuid: "00000000-0000-0000-0000-000000000900", reorderLevel: "50.000000" },
        deps,
      ),
    ).rejects.toThrow(ReorderLevelNotFoundError);
    expect(deps.repository.updateReorderLevel).not.toHaveBeenCalled();
  });

  it("throws InvalidReorderLevelQuantityError when the supplied reorderLevel is negative", async () => {
    const deps = buildDeps();
    const reorderLevel = buildReorderLevel({ uuid: "00000000-0000-0000-0000-000000000900" });
    (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(reorderLevel);

    await expect(
      updateReorderLevel({ tenantId: 1n, reorderLevelUuid: reorderLevel.uuid, reorderLevel: "-5" }, deps),
    ).rejects.toThrow(InvalidReorderLevelQuantityError);
    expect(deps.repository.updateReorderLevel).not.toHaveBeenCalled();
  });

  it("does not re-validate reorderLevel when it is not supplied (only reorderQuantity changing)", async () => {
    const deps = buildDeps();
    const reorderLevel = buildReorderLevel({ uuid: "00000000-0000-0000-0000-000000000900" });
    (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(reorderLevel);
    (deps.repository.updateReorderLevel as jest.Mock).mockResolvedValue(reorderLevel);

    await updateReorderLevel(
      { tenantId: 1n, reorderLevelUuid: reorderLevel.uuid, reorderQuantity: "600.000000" },
      deps,
    );

    expect(deps.repository.updateReorderLevel).toHaveBeenCalledWith(1n, reorderLevel.uuid, {
      reorderLevel: undefined,
      reorderQuantity: "600.000000",
      updatedBy: null,
    });
  });

  it("updates the Reorder Level's editable fields and returns the repository's result", async () => {
    const deps = buildDeps();
    const reorderLevel = buildReorderLevel({ uuid: "00000000-0000-0000-0000-000000000900" });
    const updated = buildReorderLevel({
      uuid: reorderLevel.uuid,
      reorderLevel: "150.000000",
      reorderQuantity: "700.000000",
    });
    (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(reorderLevel);
    (deps.repository.updateReorderLevel as jest.Mock).mockResolvedValue(updated);

    const result = await updateReorderLevel(
      {
        tenantId: 1n,
        reorderLevelUuid: reorderLevel.uuid,
        reorderLevel: "150.000000",
        reorderQuantity: "700.000000",
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateReorderLevel).toHaveBeenCalledWith(1n, reorderLevel.uuid, {
      reorderLevel: "150.000000",
      reorderQuantity: "700.000000",
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });
});
