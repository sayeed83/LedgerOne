import { listRolePermissions, ListRolePermissionsDeps } from "./list-role-permissions.service";
import { RoleNotFoundError } from "../domain/errors/authorization.errors";
import { buildRole, buildPermission, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): ListRolePermissionsDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("listRolePermissions", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(listRolePermissions({ tenantId: 1n, roleUuid: "missing-uuid" }, deps)).rejects.toThrow(RoleNotFoundError);
  });

  it("returns the permissions granted to the role", async () => {
    const deps = buildDeps();
    const role = buildRole();
    const permissions = [buildPermission()];
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue(permissions);

    const result = await listRolePermissions({ tenantId: 1n, roleUuid: role.uuid }, deps);

    expect(deps.repository.listPermissionsForRole).toHaveBeenCalledWith(1n, role.id);
    expect(result).toBe(permissions);
  });
});
