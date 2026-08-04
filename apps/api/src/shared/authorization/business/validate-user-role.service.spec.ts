import { validateUserRole, ValidateUserRoleDeps } from "./validate-user-role.service";
import { RoleNotFoundError, UserRoleNotFoundError } from "../domain/errors/authorization.errors";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

const userUuid = "00000000-0000-0000-0000-000000000099";

function buildDeps(): ValidateUserRoleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("validateUserRole", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(validateUserRole({ tenantId: 1n, userUuid, roleUuid: "missing-uuid" }, deps)).rejects.toThrow(
      RoleNotFoundError,
    );
  });

  it("throws UserRoleNotFoundError when the user does not hold the role", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([]);

    await expect(validateUserRole({ tenantId: 1n, userUuid, roleUuid: role.uuid }, deps)).rejects.toThrow(
      UserRoleNotFoundError,
    );
  });

  it("resolves when the user holds the role", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([role]);

    await expect(validateUserRole({ tenantId: 1n, userUuid, roleUuid: role.uuid }, deps)).resolves.toBeUndefined();
  });
});
