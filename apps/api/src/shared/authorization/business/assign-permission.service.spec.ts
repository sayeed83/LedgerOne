import { assignPermission, AssignPermissionDeps } from "./assign-permission.service";
import {
  RoleNotFoundError,
  PermissionNotFoundError,
  DuplicatePermissionAssignmentError,
} from "../domain/errors/authorization.errors";
import { buildRole, buildPermission, buildRolePermission, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): AssignPermissionDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("assignPermission", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      assignPermission({ tenantId: 1n, roleUuid: "missing-uuid", permissionKey: "accounting.journal_entry.post" }, deps),
    ).rejects.toThrow(RoleNotFoundError);
    expect(deps.repository.assignPermissionToRole).not.toHaveBeenCalled();
  });

  it("throws PermissionNotFoundError when the permission does not exist", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(null);

    await expect(
      assignPermission({ tenantId: 1n, roleUuid: role.uuid, permissionKey: "nonexistent.key.nope" }, deps),
    ).rejects.toThrow(PermissionNotFoundError);
    expect(deps.repository.assignPermissionToRole).not.toHaveBeenCalled();
  });

  it("throws DuplicatePermissionAssignmentError when the permission is already granted", async () => {
    const deps = buildDeps();
    const role = buildRole();
    const permission = buildPermission();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
    (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue([permission]);

    await expect(
      assignPermission({ tenantId: 1n, roleUuid: role.uuid, permissionKey: permission.permissionKey }, deps),
    ).rejects.toThrow(DuplicatePermissionAssignmentError);
    expect(deps.repository.assignPermissionToRole).not.toHaveBeenCalled();
  });

  it("assigns the permission when not already granted", async () => {
    const deps = buildDeps();
    const role = buildRole();
    const permission = buildPermission();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findPermissionByKey as jest.Mock).mockResolvedValue(permission);
    (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue([]);
    (deps.repository.assignPermissionToRole as jest.Mock).mockResolvedValue(buildRolePermission());

    await assignPermission({ tenantId: 1n, roleUuid: role.uuid, permissionKey: permission.permissionKey, createdBy: 2n }, deps);

    expect(deps.repository.assignPermissionToRole).toHaveBeenCalledWith(1n, role.id, permission.id, 2n);
  });
});
