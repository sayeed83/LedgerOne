import { getCompany, GetCompanyDeps } from "./get-company.service";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): GetCompanyDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("getCompany", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getCompany({ tenantUuid: "missing", companyUuid: "co-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getCompany({ tenantUuid: tenant.uuid, companyUuid: "missing-co" }, deps)).rejects.toThrow(
      CompanyNotFoundError,
    );
  });

  it("returns the company when found under the correct tenant (cross-tenant isolation)", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

    const result = await getCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps);

    expect(deps.repository.findCompanyByUuid).toHaveBeenCalledWith(tenant.id, company.uuid);
    expect(result).toBe(company);
  });
});
