import { listPermissions, ListPermissionsDeps } from "./list-permissions.service";
import { buildPermission, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): ListPermissionsDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("listPermissions", () => {
  it("returns every platform-defined permission", async () => {
    const deps = buildDeps();
    const permissions = [buildPermission(), buildPermission({ uuid: "00000000-0000-0000-0000-000000000011" })];
    (deps.repository.listPermissions as jest.Mock).mockResolvedValue(permissions);

    const result = await listPermissions(deps);

    expect(deps.repository.listPermissions).toHaveBeenCalledWith();
    expect(result).toBe(permissions);
  });
});
