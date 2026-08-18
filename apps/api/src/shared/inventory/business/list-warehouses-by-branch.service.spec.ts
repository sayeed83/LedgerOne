import { listWarehousesByBranch, ListWarehousesByBranchDeps } from "./list-warehouses-by-branch.service";
import { buildWarehouse, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListWarehousesByBranchDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listWarehousesByBranch", () => {
  it("passes tenantId and branchUuid through to the repository", async () => {
    const deps = buildDeps();
    const warehouses = [buildWarehouse()];
    (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue(warehouses);

    const result = await listWarehousesByBranch(
      { tenantId: 1n, branchUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(deps.repository.listWarehousesByBranch).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000200");
    expect(result).toBe(warehouses);
  });

  it("does not merge results across two different Branches — each call is independently scoped (branch isolation)", async () => {
    const deps = buildDeps();
    const branchAWarehouses = [buildWarehouse({ branchUuid: "00000000-0000-0000-0000-000000000200" })];
    const branchBWarehouses = [buildWarehouse({ branchUuid: "00000000-0000-0000-0000-000000000201" })];
    (deps.repository.listWarehousesByBranch as jest.Mock).mockImplementation(
      async (_tenantId: bigint, branchUuid: string) =>
        branchUuid === "00000000-0000-0000-0000-000000000200" ? branchAWarehouses : branchBWarehouses,
    );

    const resultA = await listWarehousesByBranch(
      { tenantId: 1n, branchUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );
    const resultB = await listWarehousesByBranch(
      { tenantId: 1n, branchUuid: "00000000-0000-0000-0000-000000000201" },
      deps,
    );

    expect(resultA).toBe(branchAWarehouses);
    expect(resultB).toBe(branchBWarehouses);
    expect(resultA).not.toBe(resultB);
  });
});
