import { createCompany, CreateCompanyDeps, CreateCompanyInput } from "./create-company.service";
import { TenantNotFoundError, DuplicateCompanyCodeError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): CreateCompanyDeps {
  return { repository: createFakeOrganizationRepository() };
}

function buildInput(overrides: Partial<CreateCompanyInput> = {}): CreateCompanyInput {
  return {
    tenantUuid: "00000000-0000-0000-0000-000000000001",
    companyCode: "CO-002",
    legalName: "Beta Industries Ltd.",
    taxRegistrationNumber: "TAX-002",
    baseCurrencyCode: "USD",
    country: "US",
    timeZone: "UTC",
    financialYearStartMonth: 4,
    financialYearStartDay: 1,
    ...overrides,
  };
}

describe("createCompany", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createCompany(buildInput(), deps)).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.createCompany).not.toHaveBeenCalled();
  });

  it("throws DuplicateCompanyCodeError when the company code is already in use within the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue([
      buildCompany({ companyCode: "CO-002" }),
    ]);

    await expect(createCompany(buildInput({ companyCode: "CO-002" }), deps)).rejects.toThrow(
      DuplicateCompanyCodeError,
    );
    expect(deps.repository.createCompany).not.toHaveBeenCalled();
  });

  it("creates the company when the code is unique within the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue([
      buildCompany({ companyCode: "CO-001" }),
    ]);
    (deps.repository.createCompany as jest.Mock).mockResolvedValue(buildCompany({ companyCode: "CO-002" }));

    const result = await createCompany(buildInput(), deps);

    expect(deps.repository.createCompany).toHaveBeenCalledWith(tenant.id, {
      companyCode: "CO-002",
      legalName: "Beta Industries Ltd.",
      displayName: null,
      legalEntityType: null,
      taxRegistrationNumber: "TAX-002",
      baseCurrencyCode: "USD",
      country: "US",
      timeZone: "UTC",
      financialYearStartMonth: 4,
      financialYearStartDay: 1,
      createdBy: null,
    });
    expect(result.companyCode).toBe("CO-002");
  });
});
