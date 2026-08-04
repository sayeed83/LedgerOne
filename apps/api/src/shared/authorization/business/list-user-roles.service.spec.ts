import { listUserRoles, ListUserRolesDeps } from "./list-user-roles.service";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

const userUuid = "00000000-0000-0000-0000-000000000099";

function buildDeps(): ListUserRolesDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("listUserRoles", () => {
  it("returns the roles assigned to the user", async () => {
    const deps = buildDeps();
    const roles = [buildRole()];
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue(roles);

    const result = await listUserRoles({ tenantId: 1n, userUuid }, deps);

    expect(deps.repository.listRolesForUser).toHaveBeenCalledWith(1n, userUuid);
    expect(result).toBe(roles);
  });
});
