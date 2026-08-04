import { updateDepartment, UpdateDepartmentDeps } from "./update-department.service";
import { TenantNotFoundError, DepartmentNotFoundError, DuplicateDepartmentCodeError } from "../domain/errors/organization.errors";
import { buildTenant, buildDepartment, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): UpdateDepartmentDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("updateDepartment", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateDepartment({ tenantUuid: "missing", departmentUuid: "dpt-uuid", departmentName: "New Name" }, deps),
    ).rejects.toThrow(TenantNotFoundError);
  });

  it("throws DepartmentNotFoundError when the department does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateDepartment(
        { tenantUuid: tenant.uuid, departmentUuid: "missing-dpt", departmentName: "New Name" },
        deps,
      ),
    ).rejects.toThrow(DepartmentNotFoundError);
  });

  it("throws DuplicateDepartmentCodeError when renaming to a code already used by another department in the same company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const department = buildDepartment({ uuid: "dpt-a", departmentCode: "DPT-001", companyId: 1n });
    const other = buildDepartment({ uuid: "dpt-b", departmentCode: "DPT-002", companyId: 1n });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(department);
    (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue([department, other]);

    await expect(
      updateDepartment(
        { tenantUuid: tenant.uuid, departmentUuid: department.uuid, departmentCode: "DPT-002" },
        deps,
      ),
    ).rejects.toThrow(DuplicateDepartmentCodeError);
    expect(deps.repository.updateDepartment).not.toHaveBeenCalled();
  });

  it("updates the department when the new code is unique within the company", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const department = buildDepartment({ uuid: "dpt-a", departmentCode: "DPT-001", companyId: 1n });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(department);
    (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue([department]);
    (deps.repository.updateDepartment as jest.Mock).mockResolvedValue(
      buildDepartment({ departmentCode: "DPT-003" }),
    );

    const result = await updateDepartment(
      { tenantUuid: tenant.uuid, departmentUuid: department.uuid, departmentCode: "DPT-003" },
      deps,
    );

    expect(deps.repository.updateDepartment).toHaveBeenCalledWith(
      tenant.id,
      department.uuid,
      expect.objectContaining({ departmentCode: "DPT-003", updatedBy: null }),
    );
    expect(result.departmentCode).toBe("DPT-003");
  });
});
