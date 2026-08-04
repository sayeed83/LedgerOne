import { listRoles, ListRolesDeps } from "./list-roles.service";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): ListRolesDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("listRoles", () => {
  it("returns the roles for the given tenant", async () => {
    const deps = buildDeps();
    const roles = [buildRole(), buildRole({ uuid: "00000000-0000-0000-0000-000000000099" })];
    (deps.repository.listRoles as jest.Mock).mockResolvedValue(roles);

    const result = await listRoles({ tenantId: 1n }, deps);

    expect(deps.repository.listRoles).toHaveBeenCalledWith(1n);
    expect(result).toBe(roles);
  });
});
