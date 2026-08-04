import { validateUserPermission, ValidateUserPermissionDeps } from "./validate-user-permission.service";
import { PermissionDeniedError } from "../domain/errors/authorization.errors";
import { buildRole, buildPermission, createFakeAuthorizationRepository } from "./test-support/fixtures";

const userUuid = "00000000-0000-0000-0000-000000000099";

function buildDeps(): ValidateUserPermissionDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("validateUserPermission", () => {
  it("throws PermissionDeniedError when the user has no roles", async () => {
    const deps = buildDeps();
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([]);

    await expect(
      validateUserPermission({ tenantId: 1n, userUuid, permissionKey: "accounting.journal_entry.post" }, deps),
    ).rejects.toThrow(PermissionDeniedError);
  });

  it("throws PermissionDeniedError when none of the user's roles grant the permission", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([role]);
    (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue([buildPermission({ permissionKey: "sales.order.create" })]);

    await expect(
      validateUserPermission({ tenantId: 1n, userUuid, permissionKey: "accounting.journal_entry.post" }, deps),
    ).rejects.toThrow(PermissionDeniedError);
  });

  it("resolves when a granted role includes the permission", async () => {
    const deps = buildDeps();
    const role = buildRole();
    const permission = buildPermission({ permissionKey: "accounting.journal_entry.post" });
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([role]);
    (deps.repository.listPermissionsForRole as jest.Mock).mockResolvedValue([permission]);

    await expect(
      validateUserPermission({ tenantId: 1n, userUuid, permissionKey: "accounting.journal_entry.post" }, deps),
    ).resolves.toBeUndefined();
  });

  it("checks every assigned role, including a Retired role whose grants still count", async () => {
    const deps = buildDeps();
    const activeRole = buildRole({ id: 1n, uuid: "00000000-0000-0000-0000-000000000001" });
    const retiredRole = buildRole({ id: 2n, uuid: "00000000-0000-0000-0000-000000000002" });
    (deps.repository.listRolesForUser as jest.Mock).mockResolvedValue([activeRole, retiredRole]);
    (deps.repository.listPermissionsForRole as jest.Mock).mockImplementation((_tenantId: bigint, roleId: bigint) => {
      if (roleId === 2n) {
        return Promise.resolve([buildPermission({ permissionKey: "accounting.journal_entry.post" })]);
      }
      return Promise.resolve([]);
    });

    await expect(
      validateUserPermission({ tenantId: 1n, userUuid, permissionKey: "accounting.journal_entry.post" }, deps),
    ).resolves.toBeUndefined();
  });
});
