import { retireRole, RetireRoleDeps } from "./retire-role.service";
import { RoleNotFoundError, InvalidRoleStatusTransitionError } from "../domain/errors/authorization.errors";
import { RoleStatus } from "../domain/enums/role-status.enum";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): RetireRoleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

describe("retireRole", () => {
  it("throws RoleNotFoundError when the role does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(null);

    await expect(retireRole({ tenantId: 1n, roleUuid: "missing-uuid" }, deps)).rejects.toThrow(RoleNotFoundError);
    expect(deps.repository.retireRole).not.toHaveBeenCalled();
  });

  it("retires an Active role", async () => {
    const deps = buildDeps();
    const role = buildRole({ status: RoleStatus.Active });
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);
    (deps.repository.retireRole as jest.Mock).mockResolvedValue(buildRole({ status: RoleStatus.Retired }));

    const result = await retireRole({ tenantId: 1n, roleUuid: role.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.retireRole).toHaveBeenCalledWith(1n, role.uuid, 7n);
    expect(result.status).toBe(RoleStatus.Retired);
  });

  it("rejects retiring an already-Retired role", async () => {
    const deps = buildDeps();
    const role = buildRole({ status: RoleStatus.Retired });
    (deps.repository.findRoleByUuid as jest.Mock).mockResolvedValue(role);

    await expect(retireRole({ tenantId: 1n, roleUuid: role.uuid }, deps)).rejects.toThrow(
      InvalidRoleStatusTransitionError,
    );
    expect(deps.repository.retireRole).not.toHaveBeenCalled();
  });
});
