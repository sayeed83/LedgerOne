import { updateBranch, UpdateBranchDeps } from "./update-branch.service";
import { TenantNotFoundError, BranchNotFoundError, DuplicateBranchCodeError } from "../domain/errors/organization.errors";
import { buildTenant, buildBranch, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): UpdateBranchDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("updateBranch", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateBranch({ tenantUuid: "missing", branchUuid: "br-uuid", branchName: "New Name" }, deps),
    ).rejects.toThrow(TenantNotFoundError);
  });

  it("throws BranchNotFoundError when the branch does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateBranch({ tenantUuid: tenant.uuid, branchUuid: "missing-br", branchName: "New Name" }, deps),
    ).rejects.toThrow(BranchNotFoundError);
  });

  it("throws DuplicateBranchCodeError when renaming to a code already used by another branch in the same company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const branch = buildBranch({ uuid: "br-a", branchCode: "BR-001", companyId: 1n });
    const other = buildBranch({ uuid: "br-b", branchCode: "BR-002", companyId: 1n });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(branch);
    (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue([branch, other]);

    await expect(
      updateBranch({ tenantUuid: tenant.uuid, branchUuid: branch.uuid, branchCode: "BR-002" }, deps),
    ).rejects.toThrow(DuplicateBranchCodeError);
    expect(deps.repository.updateBranch).not.toHaveBeenCalled();
  });

  it("updates the branch when the new code is unique within the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const branch = buildBranch({ uuid: "br-a", branchCode: "BR-001", companyId: 1n });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(branch);
    (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue([branch]);
    (deps.repository.updateBranch as jest.Mock).mockResolvedValue(buildBranch({ branchCode: "BR-003" }));

    const result = await updateBranch(
      { tenantUuid: tenant.uuid, branchUuid: branch.uuid, branchCode: "BR-003" },
      deps,
    );

    expect(deps.repository.updateBranch).toHaveBeenCalledWith(
      tenant.id,
      branch.uuid,
      expect.objectContaining({ branchCode: "BR-003", updatedBy: null }),
    );
    expect(result.branchCode).toBe("BR-003");
  });
});
