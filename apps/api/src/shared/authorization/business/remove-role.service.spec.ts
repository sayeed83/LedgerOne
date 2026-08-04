import { removeRole, RemoveRoleDeps } from "./remove-role.service";
import { RoleNotFoundError, UserRoleNotFoundError } from "../domain/errors/authorization.errors";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

const userUuid = "00000000-0000-0000-0000-000000000099";

function buildDeps(): RemoveRoleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("removeRole", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(removeRole({ tenantId: 1n, userUuid, roleUuid: "missing-uuid" }, deps)).rejects.toThrow(RoleNotFoundError);
    expect(deps.repository.removeRoleFromUser).not.toHaveBeenCalled();
  });

  it("propagates UserRoleNotFoundError from the repository when no active assignment matches", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.removeRoleFromUser as jest.Mock).mockRejectedValue(
      new UserRoleNotFoundError(userUuid, role.uuid),
    );

    await expect(removeRole({ tenantId: 1n, userUuid, roleUuid: role.uuid }, deps)).rejects.toThrow(UserRoleNotFoundError);
  });

  it("removes the assignment when it exists", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.removeRoleFromUser as jest.Mock).mockResolvedValue(undefined);

    await removeRole({ tenantId: 1n, userUuid, roleUuid: role.uuid, updatedBy: 8n }, deps);

    expect(deps.repository.removeRoleFromUser).toHaveBeenCalledWith(1n, userUuid, role.id, 8n);
  });
});
