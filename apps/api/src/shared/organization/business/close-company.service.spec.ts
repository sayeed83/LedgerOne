import { closeCompany, CloseCompanyDeps } from "./close-company.service";
import { TenantNotFoundError, CompanyNotFoundError, InvalidCompanyStatusTransitionError } from "../domain/errors/organization.errors";
import { CompanyStatus } from "../domain/enums/company-status.enum";
import { buildTenant, buildCompany, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): CloseCompanyDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("closeCompany", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(closeCompany({ tenantUuid: "missing", companyUuid: "co-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(closeCompany({ tenantUuid: tenant.uuid, companyUuid: "missing-co" }, deps)).rejects.toThrow(
      CompanyNotFoundError,
    );
  });

  it("closes an Active company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ status: CompanyStatus.Active });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.deactivateCompany as jest.Mock).mockResolvedValue(
      buildCompany({ status: CompanyStatus.Closed }),
    );

    const result = await closeCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.deactivateCompany).toHaveBeenCalledWith(tenant.id, company.uuid, 7n);
    expect(result.status).toBe(CompanyStatus.Closed);
  });

  it("rejects closing a Draft company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ status: CompanyStatus.Draft });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

    await expect(closeCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps)).rejects.toThrow(
      InvalidCompanyStatusTransitionError,
    );
    expect(deps.repository.deactivateCompany).not.toHaveBeenCalled();
  });

  it("rejects closing an already-Closed company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany({ status: CompanyStatus.Closed });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

    await expect(closeCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps)).rejects.toThrow(
      InvalidCompanyStatusTransitionError,
    );
  });
});
