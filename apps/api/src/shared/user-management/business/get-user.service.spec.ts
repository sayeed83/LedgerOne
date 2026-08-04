import { getUser, GetUserDeps } from "./get-user.service";
import { UserNotFoundError } from "../domain/errors/user-management.errors";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): GetUserDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("getUser", () => {
  it("throws UserNotFoundError when the user does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getUser({ tenantId: 1n, userUuid: "missing-uuid" }, deps)).rejects.toThrow(UserNotFoundError);
  });

  it("returns the user when found", async () => {
    const deps = buildDeps();
    const user = buildUser();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);

    const result = await getUser({ tenantId: 1n, userUuid: user.uuid }, deps);

    expect(result).toBe(user);
    expect(deps.repository.findUserByUuid).toHaveBeenCalledWith(1n, user.uuid);
  });
});
