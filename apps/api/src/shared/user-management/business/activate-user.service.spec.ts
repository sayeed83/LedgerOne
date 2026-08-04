import { activateUser, ActivateUserDeps } from "./activate-user.service";
import { UserNotFoundError, InvalidUserStatusTransitionError } from "../domain/errors/user-management.errors";
import { UserStatus } from "../domain/enums/user-status.enum";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): ActivateUserDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("activateUser", () => {
  it("throws UserNotFoundError when the user does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

    await expect(activateUser({ tenantId: 1n, userUuid: "missing-uuid" }, deps)).rejects.toThrow(UserNotFoundError);
    expect(deps.repository.activateUser).not.toHaveBeenCalled();
  });

  it("activates an Invited user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Invited });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
    (deps.repository.activateUser as jest.Mock).mockResolvedValue(buildUser({ status: UserStatus.Active }));

    const result = await activateUser({ tenantId: 1n, userUuid: user.uuid, updatedBy: 3n }, deps);

    expect(deps.repository.activateUser).toHaveBeenCalledWith(1n, user.uuid, 3n);
    expect(result.status).toBe(UserStatus.Active);
  });

  it("activates a Suspended user (reinstatement)", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Suspended });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
    (deps.repository.activateUser as jest.Mock).mockResolvedValue(buildUser({ status: UserStatus.Active }));

    await activateUser({ tenantId: 1n, userUuid: user.uuid }, deps);

    expect(deps.repository.activateUser).toHaveBeenCalledWith(1n, user.uuid, null);
  });

  it("rejects activating an already-Active user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Active });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    await expect(activateUser({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
      InvalidUserStatusTransitionError,
    );
    expect(deps.repository.activateUser).not.toHaveBeenCalled();
  });

  it("rejects activating a Deactivated user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Deactivated });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    await expect(activateUser({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
      InvalidUserStatusTransitionError,
    );
  });
});
