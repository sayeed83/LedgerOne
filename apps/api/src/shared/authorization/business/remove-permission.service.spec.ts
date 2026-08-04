import { removePermission, RemovePermissionDeps } from "./remove-permission.service";
import { RoleNotFoundError, PermissionNotFoundError, RolePermissionNotFoundError } from "../domain/errors/authorization.errors";
import { buildRole, buildPermission, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): RemovePermissionDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("removePermission", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      removePermission({ tenantId: 1n, roleUuid: "missing-uuid", permissionKey: "accounting.journal_entry.post" }, deps),
    ).rejects.toThrow(RoleNotFoundError);
    expect(deps.repository.removePermissionFromRole).not.toHaveBeenCalled();
  });

  it("throws PermissionNotFoundError when the permission does not exist", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(null);

    await expect(
      removePermission({ tenantId: 1n, roleUuid: role.uuid, permissionKey: "nonexistent.key.nope" }, deps),
    ).rejects.toThrow(PermissionNotFoundError);
    expect(deps.repository.removePermissionFromRole).not.toHaveBeenCalled();
  });

  it("propagates RolePermissionNotFoundError from the repository when no active grant matches", async () => {
    const deps = buildDeps();
    const role = buildRole();
    const permission = buildPermission();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
    (deps.repository.removePermissionFromRole as jest.Mock).mockRejectedValue(
      new RolePermissionNotFoundError(role.id.toString(), permission.id.toString()),
    );

    await expect(
      removePermission({ tenantId: 1n, roleUuid: role.uuid, permissionKey: permission.permissionKey }, deps),
    ).rejects.toThrow(RolePermissionNotFoundError);
  });

  it("removes the grant when it exists", async () => {
    const deps = buildDeps();
    const role = buildRole();
    const permission = buildPermission();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
    (deps.repository.removePermissionFromRole as jest.Mock).mockResolvedValue(undefined);

    await removePermission({ tenantId: 1n, roleUuid: role.uuid, permissionKey: permission.permissionKey, updatedBy: 9n }, deps);

    expect(deps.repository.removePermissionFromRole).toHaveBeenCalledWith(1n, role.id, permission.id, 9n);
  });
});
