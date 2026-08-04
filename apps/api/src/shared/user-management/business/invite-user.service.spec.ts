import { inviteUser, InviteUserDeps, InviteUserInput } from "./invite-user.service";
import { DuplicateUserEmailError } from "../domain/errors/user-management.errors";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): InviteUserDeps {
  return { repository: createFakeUserManagementRepository() };
}

function buildInput(overrides: Partial<InviteUserInput> = {}): InviteUserInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000010",
    firstName: "Arjun",
    lastName: "Mehta",
    email: "arjun.mehta@example.com",
    ...overrides,
  };
}

describe("inviteUser", () => {
  it("throws DuplicateUserEmailError when the email is already in use within the tenant (Ch.10.8)", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(buildUser());

    await expect(inviteUser(buildInput(), deps)).rejects.toThrow(DuplicateUserEmailError);
    expect(deps.repository.createUser).not.toHaveBeenCalled();
  });

  it("invites the user (delegates to the same persistence as createUser)", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (deps.repository.createUser as jest.Mock).mockResolvedValue(buildUser({ email: "arjun.mehta@example.com" }));

    const result = await inviteUser(buildInput(), deps);

    expect(deps.repository.createUser).toHaveBeenCalledWith(1n, expect.objectContaining({ email: "arjun.mehta@example.com" }));
    expect(result.email).toBe("arjun.mehta@example.com");
  });
});
