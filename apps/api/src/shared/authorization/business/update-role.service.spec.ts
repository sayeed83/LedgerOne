import { updateRole, UpdateRoleDeps } from "./update-role.service";
import { RoleNotFoundError, DuplicateRoleNameError } from "../domain/errors/authorization.errors";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): UpdateRoleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("updateRole", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(updateRole({ tenantId: 1n, roleUuid: "missing-uuid", name: "New Name" }, deps)).rejects.toThrow(
      RoleNotFoundError,
    );
    expect(deps.repository.updateRole).not.toHaveBeenCalled();
  });

  it("throws DuplicateRoleNameError when the new name collides with a different role", async () => {
    const deps = buildDeps();
    const role = buildRole({ name: "Accountant" });
    const other = buildRole({ uuid: "00000000-0000-0000-0000-000000000099", name: "Sales Manager" });
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(other);

    await expect(updateRole({ tenantId: 1n, roleUuid: role.uuid, name: "Sales Manager" }, deps)).rejects.toThrow(
      DuplicateRoleNameError,
    );
    expect(deps.repository.updateRole).not.toHaveBeenCalled();
  });

  it("allows renaming when the found name belongs to the same role", async () => {
    const deps = buildDeps();
    const role = buildRole({ name: "Accountant" });
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(role);
    (deps.repository.updateRole as jest.Mock).mockResolvedValue(buildRole({ name: "Accountant" }));

    await updateRole({ tenantId: 1n, roleUuid: role.uuid, name: "Accountant" }, deps);

    expect(deps.repository.updateRole).toHaveBeenCalledWith(1n, role.uuid, {
      name: "Accountant",
      description: undefined,
      updatedBy: null,
    });
  });

  it("updates the role when the name is unchanged or unique", async () => {
    const deps = buildDeps();
    const role = buildRole();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.updateRole as jest.Mock).mockResolvedValue(buildRole({ description: "Updated" }));

    const result = await updateRole({ tenantId: 1n, roleUuid: role.uuid, description: "Updated", updatedBy: 4n }, deps);

    expect(deps.repository.findRoleByName).not.toHaveBeenCalled();
    expect(deps.repository.updateRole).toHaveBeenCalledWith(1n, role.uuid, {
      name: undefined,
      description: "Updated",
      updatedBy: 4n,
    });
    expect(result.description).toBe("Updated");
  });
});
