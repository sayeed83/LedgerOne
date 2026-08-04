import { createDepartment, CreateDepartmentDeps, CreateDepartmentInput } from "./create-department.service";
import { TenantNotFoundError, CompanyNotFoundError, DuplicateDepartmentCodeError } from "../domain/errors/organization.errors";
import { buildTenant, buildCompany, buildDepartment, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): CreateDepartmentDeps {
  return { repository: createFakeOrganizationRepository() };
}

function buildInput(overrides: Partial<CreateDepartmentInput> = {}): CreateDepartmentInput {
  return {
    tenantUuid: "00000000-0000-0000-0000-000000000001",
    companyUuid: "00000000-0000-0000-0000-000000000010",
    departmentCode: "DPT-002",
    departmentName: "Operations",
    ...overrides,
  };
}

describe("createDepartment", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createDepartment(buildInput(), deps)).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.createDepartment).not.toHaveBeenCalled();
  });

  it("throws CompanyNotFoundError when the company does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createDepartment(buildInput(), deps)).rejects.toThrow(CompanyNotFoundError);
    expect(deps.repository.createDepartment).not.toHaveBeenCalled();
  });

  it("throws DuplicateDepartmentCodeError when the department code is already in use within the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue([
      buildDepartment({ departmentCode: "DPT-002" }),
    ]);

    await expect(createDepartment(buildInput({ departmentCode: "DPT-002" }), deps)).rejects.toThrow(
      DuplicateDepartmentCodeError,
    );
    expect(deps.repository.createDepartment).not.toHaveBeenCalled();
  });

  it("creates the department when the code is unique within the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const company = buildCompany();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
    (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue([
      buildDepartment({ departmentCode: "DPT-001" }),
    ]);
    (deps.repository.createDepartment as jest.Mock).mockResolvedValue(
      buildDepartment({ departmentCode: "DPT-002" }),
    );

    const result = await createDepartment(buildInput(), deps);

    expect(deps.repository.createDepartment).toHaveBeenCalledWith(tenant.id, company.id, {
      departmentCode: "DPT-002",
      departmentName: "Operations",
      createdBy: null,
    });
    expect(result.departmentCode).toBe("DPT-002");
  });
});
