import { createBranch, CreateBranchDeps, CreateBranchInput } from "./create-branch.service";
import { TenantNotFoundError, CompanyNotFoundError, DuplicateBranchCodeError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, buildBranch, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): CreateBranchDeps {
  return { repository: createFakeOrganizationRepository() };
}

function buildInput(overrides: Partial<CreateBranchInput> = {}): CreateBranchInput {
  return {
    tenantUuid: "00000000-0000-0000-0000-000000000001",
    companyUuid: "00000000-0000-0000-0000-000000000010",
    branchCode: "BR-002",
    branchName: "Downtown Branch",
    addressLine1: "456 Market St",
    city: "Metropolis",
    countryCode: "US",
    timeZone: "UTC",
    ...overrides,
  };
}

describe("createBranch", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createBranch(buildInput(), deps)).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.createBranch).not.toHaveBeenCalled();
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createBranch(buildInput(), deps)).rejects.toThrow(CompanyNotFoundError);
    expect(deps.repository.createBranch).not.toHaveBeenCalled();
  });

  it("throws DuplicateBranchCodeError when the branch code is already in use within the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue([buildBranch({ branchCode: "BR-002" })]);

    await expect(createBranch(buildInput({ branchCode: "BR-002" }), deps)).rejects.toThrow(
      DuplicateBranchCodeError,
    );
    expect(deps.repository.createBranch).not.toHaveBeenCalled();
  });

  it("creates the branch when the code is unique within the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue([buildBranch({ branchCode: "BR-001" })]);
    (deps.repository.createBranch as jest.Mock).mockResolvedValue(buildBranch({ branchCode: "BR-002" }));

    const result = await createBranch(buildInput(), deps);

    expect(deps.repository.createBranch).toHaveBeenCalledWith(tenant.id, company.id, {
      branchCode: "BR-002",
      branchName: "Downtown Branch",
      addressLine1: "456 Market St",
      addressLine2: null,
      city: "Metropolis",
      region: null,
      postalCode: null,
      countryCode: "US",
      timeZone: "UTC",
      createdBy: null,
    });
    expect(result.branchCode).toBe("BR-002");
  });
});
