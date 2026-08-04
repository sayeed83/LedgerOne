import { getTenant, GetTenantDeps } from "./get-tenant.service";
import { TenantNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): GetTenantDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("getTenant", () => {
  it("returns the Tenant when found by uuid", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    const result = await getTenant({ tenantUuid: tenant.uuid }, deps);

    expect(deps.repository.findTenantByUuid).toHaveBeenCalledWith(tenant.uuid);
    expect(result).toBe(tenant);
  });

  it("throws TenantNotFoundError when no Tenant matches", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getTenant({ tenantUuid: "missing-uuid" }, deps)).rejects.toThrow(TenantNotFoundError);
  });
});
