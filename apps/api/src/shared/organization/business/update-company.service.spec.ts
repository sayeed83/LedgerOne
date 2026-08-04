import { updateCompany, UpdateCompanyDeps } from "./update-company.service";
import { TenantNotFoundError, CompanyNotFoundError, DuplicateCompanyCodeError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): UpdateCompanyDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("updateCompany", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateCompany({ tenantUuid: "missing", companyUuid: "co-uuid", legalName: "New Name" }, deps),
    ).rejects.toThrow(TenantNotFoundError);
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateCompany({ tenantUuid: tenant.uuid, companyUuid: "missing-co", legalName: "New Name" }, deps),
    ).rejects.toThrow(CompanyNotFoundError);
  });

  it("throws DuplicateCompanyCodeError when renaming to a code already used by another company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ uuid: "co-a", companyCode: "CO-001" });
    const other = buildCompany({ uuid: "co-b", companyCode: "CO-002" });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue([company, other]);

    await expect(
      updateCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid, companyCode: "CO-002" }, deps),
    ).rejects.toThrow(DuplicateCompanyCodeError);
    expect(deps.repository.updateCompany).not.toHaveBeenCalled();
  });

  it("allows keeping the same company code unchanged", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ uuid: "co-a", companyCode: "CO-001" });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.updateCompany as jest.Mock).mockResolvedValue(company);

    await updateCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid, companyCode: "CO-001" }, deps);

    expect(deps.repository.listCompaniesByTenant).not.toHaveBeenCalled();
    expect(deps.repository.updateCompany).toHaveBeenCalled();
  });

  it("updates the company when the new code is unique", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ uuid: "co-a", companyCode: "CO-001" });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue([company]);
    (deps.repository.updateCompany as jest.Mock).mockResolvedValue(buildCompany({ companyCode: "CO-003" }));

    const result = await updateCompany(
      { tenantUuid: tenant.uuid, companyUuid: company.uuid, companyCode: "CO-003" },
      deps,
    );

    expect(deps.repository.updateCompany).toHaveBeenCalledWith(
      tenant.id,
      company.uuid,
      expect.objectContaining({ companyCode: "CO-003", updatedBy: null }),
    );
    expect(result.companyCode).toBe("CO-003");
  });
});
