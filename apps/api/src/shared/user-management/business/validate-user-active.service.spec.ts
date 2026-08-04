import { validateUserActive, ValidateUserActiveDeps } from "./validate-user-active.service";
import { UserNotFoundError, UserNotActiveError } from "../domain/errors/user-management.errors";
import { UserStatus } from "../domain/enums/user-status.enum";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): ValidateUserActiveDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("validateUserActive", () => {
  it("throws UserNotFoundError when the user does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

    await expect(validateUserActive({ tenantId: 1n, userUuid: "missing-uuid" }, deps)).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it("returns the user when it is Active", async () => {
    const deps = buildDeps();
    const user = buildUser({ status: UserStatus.Active });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    const result = await validateUserActive({ tenantId: 1n, userUuid: user.uuid }, deps);

    expect(result).toBe(user);
  });

  it.each([UserStatus.Invited, UserStatus.Suspended, UserStatus.Deactivated])(
    "throws UserNotActiveError when the user status is %s",
    async (status) => {
      const deps = buildDeps();
      const user = buildUser({ status });
      (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

      await expect(validateUserActive({ tenantId: 1n, userUuid: user.uuid }, deps)).rejects.toThrow(
        UserNotActiveError,
      );
    },
  );
});
