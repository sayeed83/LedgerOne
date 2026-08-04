import { deactivateUser, DeactivateUserDeps } from "./deactivate-user.service";
import { UserNotFoundError, InvalidUserStatusTransitionError } from "../domain/errors/user-management.errors";
import { UserStatus } from "../domain/enums/user-status.enum";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): DeactivateUserDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("deactivateUser", () => {
  it("throws UserNotFoundError when the user does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

    await expect(deactivateUser({ tenantId: 1n, userUuid: "missing-uuid" }, deps)).rejects.toThrow(
      UserNotFoundError,
    );
    expect(deps.repository.deactivateUser).not.toHaveBeenCalled();
  });

  it("deactivates an Active user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Active });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
    (deps.repository.deactivateUser as jest.Mock).mockResolvedValue(buildUser({ status: UserStatus.Deactivated }));

    const result = await deactivateUser({ tenantId: 1n, userUuid: user.uuid, updatedBy: 3n }, deps);

    expect(deps.repository.deactivateUser).toHaveBeenCalledWith(1n, user.uuid, 3n);
    expect(result.status).toBe(UserStatus.Deactivated);
  });

  it("rejects deactivating an Invited user", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Invited });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    await expect(deactivateUser({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
      InvalidUserStatusTransitionError,
    );
    expect(deps.repository.deactivateUser).not.toHaveBeenCalled();
  });

  it("rejects deactivating a Suspended user (must be reinstated to Active first)", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Suspended });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    await expect(deactivateUser({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
      InvalidUserStatusTransitionError,
    );
  });

  it("rejects deactivating an already-Deactivated user (terminal state)", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Deactivated });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    await expect(deactivateUser({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
      InvalidUserStatusTransitionError,
    );
  });
});
