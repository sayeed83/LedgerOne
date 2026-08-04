import { listDepartmentsByCompany, ListDepartmentsByCompanyDeps } from "./list-departments-by-company.service";
import { TenantNotFoundError, CompanyNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, buildDepartment, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): ListDepartmentsByCompanyDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("listDepartmentsByCompany", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      listDepartmentsByCompany({ tenantUuid: "missing", companyUuid: "co-uuid" }, deps),
    ).rejects.toThrow(TenantNotFoundError);
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      listDepartmentsByCompany({ tenantUuid: tenant.uuid, companyUuid: "missing-co" }, deps),
    ).rejects.toThrow(CompanyNotFoundError);
  });

  it("returns every department scoped to the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany();
    const departments = [buildDepartment({ uuid: "dpt-a" }), buildDepartment({ uuid: "dpt-b" })];
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue(departments);

    const result = await listDepartmentsByCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps);

    expect(deps.repository.listDepartmentsByCompany).toHaveBeenCalledWith(tenant.id, company.id);
    expect(result).toBe(departments);
  });
});
