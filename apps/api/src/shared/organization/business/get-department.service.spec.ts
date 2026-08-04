import { getDepartment, GetDepartmentDeps } from "./get-department.service";
import { TenantNotFoundError, DepartmentNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildDepartment, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): GetDepartmentDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("getDepartment", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getDepartment({ tenantUuid: "missing", departmentUuid: "dpt-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("throws DepartmentNotFoundError when the department does not exist under the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getDepartment({ tenantUuid: tenant.uuid, departmentUuid: "missing-dpt" }, deps),
    ).rejects.toThrow(DepartmentNotFoundError);
  });

  it("returns the department when found under the correct tenant (cross-tenant isolation)", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const department = buildDepartment();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(department);

    const result = await getDepartment({ tenantUuid: tenant.uuid, departmentUuid: department.uuid }, deps);

    expect(deps.repository.findDepartmentByUuid).toHaveBeenCalledWith(tenant.id, department.uuid);
    expect(result).toBe(department);
  });
});
