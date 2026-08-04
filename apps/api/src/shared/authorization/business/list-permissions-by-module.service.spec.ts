import { listPermissionsByModule, ListPermissionsByModuleDeps } from "./list-permissions-by-module.service";
import { buildPermission, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): ListPermissionsByModuleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("listPermissionsByModule", () => {
  it("returns the permissions declared by the given module", async () => {
    const deps = buildDeps();
    const permissions = [buildPermission({ moduleName: "accounting" })];
    (deps.repository.listPermissionsByModule as jest.Mock).mockResolvedValue(permissions);

    const result = await listPermissionsByModule({ moduleName: "accounting" }, deps);

    expect(deps.repository.listPermissionsByModule).toHaveBeenCalledWith("accounting");
    expect(result).toBe(permissions);
  });
});
