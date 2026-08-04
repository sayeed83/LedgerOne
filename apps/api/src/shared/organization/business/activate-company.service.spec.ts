import { activateCompany, ActivateCompanyDeps } from "./activate-company.service";
import { TenantNotFoundError, CompanyNotFoundError, InvalidCompanyStatusTransitionError } from "../domain/errors/organization.errors";
import { CompanyStatus } from "../domain/enums/company-status.enum";
import { buildTenant, buildCompany, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): ActivateCompanyDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("activateCompany", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(activateCompany({ tenantUuid: "missing", companyUuid: "co-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(activateCompany({ tenantUuid: tenant.uuid, companyUuid: "missing-co" }, deps)).rejects.toThrow(
      CompanyNotFoundError,
    );
  });

  it("activates a Draft company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ status: CompanyStatus.Draft });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.activateCompany as jest.Mock).mockResolvedValue(
      buildCompany({ status: CompanyStatus.Active }),
    );

    const result = await activateCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid, updatedBy: 5n }, deps);

    expect(deps.repository.activateCompany).toHaveBeenCalledWith(tenant.id, company.uuid, 5n);
    expect(result.status).toBe(CompanyStatus.Active);
  });

  it("reopens a Closed company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ status: CompanyStatus.Closed });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.activateCompany as jest.Mock).mockResolvedValue(
      buildCompany({ status: CompanyStatus.Active }),
    );

    await activateCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps);

    expect(deps.repository.activateCompany).toHaveBeenCalledWith(tenant.id, company.uuid, null);
  });

  it("rejects activating an already-Active company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ status: CompanyStatus.Active });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

    await expect(activateCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps)).rejects.toThrow(
      InvalidCompanyStatusTransitionError,
    );
    expect(deps.repository.activateCompany).not.toHaveBeenCalled();
  });

  it("rejects activating a Dissolved company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ status: CompanyStatus.Dissolved });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

    await expect(activateCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps)).rejects.toThrow(
      InvalidCompanyStatusTransitionError,
    );
  });
});
