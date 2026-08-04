import { createRole, CreateRoleDeps, CreateRoleInput } from "./create-role.service";
import { DuplicateRoleNameError } from "../domain/errors/authorization.errors";
import { buildRole, createFakeAuthorizationRepository } from "./test-support/fixtures";

function buildDeps(): CreateRoleDeps {
  return { repository: createFakeAuthorizationRepository() };
}

function buildInput(overrides: Partial<CreateRoleInput> = {}): CreateRoleInput {
  return {
    tenantId: 1n,
    name: "Accountant",
    ...overrides,
  };
}

describe("createRole", () => {
  it("throws DuplicateRoleNameError when the name is already in use within the tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(buildRole());

    await expect(createRole(buildInput(), deps)).rejects.toThrow(DuplicateRoleNameError);
    expect(deps.repository.createRole).not.toHaveBeenCalled();
  });

  it("creates the role when the name is unique within the tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(null);
    (deps.repository.createRole as jest.Mock).mockResolvedValue(buildRole({ name: "Accountant" }));

    const result = await createRole(buildInput(), deps);

    expect(deps.repository.createRole).toHaveBeenCalledWith(1n, {
      name: "Accountant",
      description: null,
      isSystemRole: false,
      createdBy: null,
    });
    expect(result.name).toBe("Accountant");
  });

  it("passes through description, isSystemRole, and createdBy when provided", async () => {
    const deps = buildDeps();
    (deps.repository.findRoleByName as jest.Mock).mockResolvedValue(null);
    (deps.repository.createRole as jest.Mock).mockResolvedValue(buildRole());

    await createRole(
      buildInput({ description: "Bookkeeping", isSystemRole: true, createdBy: 5n }),
      deps,
    );

    expect(deps.repository.createRole).toHaveBeenCalledWith(1n, {
      name: "Accountant",
      description: "Bookkeeping",
      isSystemRole: true,
      createdBy: 5n,
    });
  });
});
