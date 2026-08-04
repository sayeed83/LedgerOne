import { updateUser, UpdateUserDeps } from "./update-user.service";
import { UserNotFoundError, DuplicateUserEmailError } from "../domain/errors/user-management.errors";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): UpdateUserDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("updateUser", () => {
  it("throws UserNotFoundError when the user does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateUser({ tenantId: 1n, userUuid: "missing-uuid", displayName: "x" }, deps),
    ).rejects.toThrow(UserNotFoundError);
    expect(deps.repository.updateUser).not.toHaveBeenCalled();
  });

  it("throws DuplicateUserEmailError when the new email is already in use by another user", async () => {
    const deps = buildDeps();
    const user = buildUser({ email: "priya.sharma@example.com" });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
    (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(
      buildUser({ uuid: "00000000-0000-0000-0000-000000000099", email: "taken@example.com" }),
    );

    await expect(
      updateUser({ tenantId: 1n, userUuid: user.uuid, email: "taken@example.com" }, deps),
    ).rejects.toThrow(DuplicateUserEmailError);
    expect(deps.repository.updateUser).not.toHaveBeenCalled();
  });

  it("allows keeping the same email (no self-collision)", async () => {
    const deps = buildDeps();
    const user = buildUser({ email: "priya.sharma@example.com" });
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
    (deps.repository.updateUser as jest.Mock).mockResolvedValue(user);

    await updateUser({ tenantId: 1n, userUuid: user.uuid, email: "priya.sharma@example.com" }, deps);

    expect(deps.repository.findUserByEmail).not.toHaveBeenCalled();
    expect(deps.repository.updateUser).toHaveBeenCalled();
  });

  it("updates the user when the email is unique (or unchanged)", async () => {
    const deps = buildDeps();
    const user = buildUser();
    (deps.repository.findUserByUuid as jest.Mock).mockResolvedValue(user);
    (deps.repository.updateUser as jest.Mock).mockResolvedValue(buildUser({ displayName: "Priya S." }));

    const result = await updateUser({ tenantId: 1n, userUuid: user.uuid, displayName: "Priya S." }, deps);

    expect(deps.repository.updateUser).toHaveBeenCalledWith(1n, user.uuid, {
      companyUuid: undefined,
      branchUuid: undefined,
      departmentUuid: undefined,
      firstName: undefined,
      middleName: undefined,
      lastName: undefined,
      displayName: "Priya S.",
      email: undefined,
      mobileNumber: undefined,
      updatedBy: null,
    });
    expect(result.displayName).toBe("Priya S.");
  });
});
