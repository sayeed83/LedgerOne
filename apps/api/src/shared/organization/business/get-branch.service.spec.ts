import { getBranch, GetBranchDeps } from "./get-branch.service";
import { TenantNotFoundError, BranchNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildBranch, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): GetBranchDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("getBranch", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getBranch({ tenantUuid: "missing", branchUuid: "br-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("throws BranchNotFoundError when the branch does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getBranch({ tenantUuid: tenant.uuid, branchUuid: "missing-br" }, deps)).rejects.toThrow(
      BranchNotFoundError,
    );
  });

  it("returns the branch when found under the correct tenant (cross-tenant isolation)", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const branch = buildBranch();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(branch);

    const result = await getBranch({ tenantUuid: tenant.uuid, branchUuid: branch.uuid }, deps);

    expect(deps.repository.findBranchByUuid).toHaveBeenCalledWith(tenant.id, branch.uuid);
    expect(result).toBe(branch);
  });
});
