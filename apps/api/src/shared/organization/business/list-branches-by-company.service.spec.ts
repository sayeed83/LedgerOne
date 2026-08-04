import { listBranchesByCompany, ListBranchesByCompanyDeps } from "./list-branches-by-company.service";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, buildBranch, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): ListBranchesByCompanyDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("listBranchesByCompany", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(listBranchesByCompany({ tenantUuid: "missing", companyUuid: "co-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      listBranchesByCompany({ tenantUuid: tenant.uuid, companyUuid: "missing-co" }, deps),
    ).rejects.toThrow(CompanyNotFoundError);
  });

  it("returns every branch scoped to the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany();
    const branches = [buildBranch({ uuid: "br-a" }), buildBranch({ uuid: "br-b" })];
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue(branches);

    const result = await listBranchesByCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps);

    expect(deps.repository.listBranchesByCompany).toHaveBeenCalledWith(tenant.id, company.id);
    expect(result).toBe(branches);
  });
});
