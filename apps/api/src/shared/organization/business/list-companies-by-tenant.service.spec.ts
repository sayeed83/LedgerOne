import { listCompaniesByTenant, ListCompaniesByTenantDeps } from "./list-companies-by-tenant.service";
import { TenantNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): ListCompaniesByTenantDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("listCompaniesByTenant", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(listCompaniesByTenant({ tenantUuid: "missing" }, deps)).rejects.toThrow(TenantNotFoundError);
  });

  it("returns every company scoped to the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const companies = [buildCompany({ uuid: "co-a" }), buildCompany({ uuid: "co-b" })];
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue(companies);

    const result = await listCompaniesByTenant({ tenantUuid: tenant.uuid }, deps);

    expect(deps.repository.listCompaniesByTenant).toHaveBeenCalledWith(tenant.id);
    expect(result).toBe(companies);
  });
});
