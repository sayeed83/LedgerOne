import { createUser, CreateUserDeps, CreateUserInput } from "./create-user.service";
import { DuplicateUserEmailError } from "../domain/errors/user-management.errors";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): CreateUserDeps {
  return { repository: createFakeUserManagementRepository() };
}

function buildInput(overrides: Partial<CreateUserInput> = {}): CreateUserInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000010",
    firstName: "Arjun",
    lastName: "Mehta",
    email: "arjun.mehta@example.com",
    ...overrides,
  };
}

describe("createUser", () => {
  it("throws DuplicateUserEmailError when the email is already in use within the tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(buildUser());

    await expect(createUser(buildInput(), deps)).rejects.toThrow(DuplicateUserEmailError);
    expect(deps.repository.createUser).not.toHaveBeenCalled();
  });

  it("creates the user when the email is unique within the tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (deps.repository.createUser as jest.Mock).mockResolvedValue(buildUser({ email: "arjun.mehta@example.com" }));

    const result = await createUser(buildInput(), deps);

    expect(deps.repository.createUser).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000010",
      branchUuid: null,
      departmentUuid: null,
      firstName: "Arjun",
      middleName: null,
      lastName: "Mehta",
      displayName: null,
      email: "arjun.mehta@example.com",
      mobileNumber: null,
      createdBy: null,
    });
    expect(result.email).toBe("arjun.mehta@example.com");
  });
});
