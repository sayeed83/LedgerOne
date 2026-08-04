import { assignRole, AssignRoleDeps } from "./assign-role.service";
import { RoleNotFoundError, RoleNotAssignableError, DuplicateRoleAssignmentError } from "../domain/errors/authorization.errors";
import { RoleStatus } from "../domain/enums/role-status.enum";
import { buildRole, buildUserRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

const userUuid = "00000000-0000-0000-0000-000000000099";

function buildDeps(): AssignRoleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("assignRole", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(assignRole({ tenantId: 1n, userUuid, roleUuid: "missing-uuid" }, deps)).rejects.toThrow(RoleNotFoundError);
    expect(deps.repository.assignRoleToUser).not.toHaveBeenCalled();
  });

  it("throws RoleNotAssignableError when the role is Retired", async () => {
    const deps = buildDeps();
    const role = buildRole({ status: RoleStatus.Retired });
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);

    await expect(assignRole({ tenantId: 1n, userUuid, roleUuid: role.uuid }, deps)).rejects.toThrow(RoleNotAssignableError);
    expect(deps.repository.assignRoleToUser).not.toHaveBeenCalled();
  });

  it("throws DuplicateRoleAssignmentError when the user already holds the role", async () => {
    const deps = buildDeps();
    const role = buildRole({ status: RoleStatus.Active });
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([role]);

    await expect(assignRole({ tenantId: 1n, userUuid, roleUuid: role.uuid }, deps)).rejects.toThrow(
      DuplicateRoleAssignmentError,
    );
    expect(deps.repository.assignRoleToUser).not.toHaveBeenCalled();
  });

  it("assigns the role when Active and not already assigned", async () => {
    const deps = buildDeps();
    const role = buildRole({ status: RoleStatus.Active });
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([]);
    (deps.repository.assignRoleToUser as jest.Mock).mockResolvedValue(buildUserRole());

    await assignRole({ tenantId: 1n, userUuid, roleUuid: role.uuid, createdBy: 3n }, deps);

    expect(deps.repository.assignRoleToUser).toHaveBeenCalledWith(1n, userUuid, role.id, 3n);
  });
});
