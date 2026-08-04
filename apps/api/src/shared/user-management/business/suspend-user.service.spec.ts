import { suspendUser, SuspendUserDeps } from "./suspend-user.service";
import { UserNotFoundError, InvalidUserStatusTransitionError } from "../domain/errors/user-management.errors";
import { UserStatus } from "../domain/enums/user-status.enum";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): SuspendUserDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("suspendUser", () => {
  it("throws UserNotFoundError when the user does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

    await expect(suspendUser({ tenantId: 1n, userUuid: "missing-uuid" }, deps)).rejects.toThrow(UserNotFoundError);
    expect(deps.repository.suspendUser).not.toHaveBeenCalled();
  });

  it("suspends an Active user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Active });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
    (deps.repository.suspendUser as jest.Mock).mockResolvedValue(buildUser({ status: UserStatus.Suspended }));

    const result = await suspendUser({ tenantId: 1n, userUuid: user.uuid, updatedBy: 3n }, deps);

    expect(deps.repository.suspendUser).toHaveBeenCalledWith(1n, user.uuid, 3n);
    expect(result.status).toBe(UserStatus.Suspended);
  });

  it("rejects suspending an Invited user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Invited });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    await expect(suspendUser({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
      InvalidUserStatusTransitionError,
    );
    expect(deps.repository.suspendUser).not.toHaveBeenCalled();
  });

  it("rejects suspending a Deactivated user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Deactivated });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    await expect(suspendUser({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
      InvalidUserStatusTransitionError,
    );
  });
});
