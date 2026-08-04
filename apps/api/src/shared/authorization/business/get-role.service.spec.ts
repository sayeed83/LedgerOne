import { getRole, GetRoleDeps } from "./get-role.service";
import { RoleNotFoundError } from "../domain/errors/authorization.errors";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): GetRoleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("getRole", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getRole({ tenantId: 1n, roleUuid: "missing-uuid" }, deps)).rejects.toThrow(RoleNotFoundError);
  });

  it("returns the role when found", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);

    const result = await getRole({ tenantId: 1n, roleUuid: role.uuid }, deps);

    expect(deps.repository.findRoleByUuid).toHaveBeenCalledWith(1n, role.uuid);
    expect(result).toBe(role);
  });
});
