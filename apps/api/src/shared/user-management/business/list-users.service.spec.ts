import { listUsers, ListUsersDeps } from "./list-users.service";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): ListUsersDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("listUsers", () => {
  it("lists by tenant when no companyUuid is given", async () => {
    const deps = buildDeps();
    const users = [buildUser()];
    (deps.repository.listUsersByTenant as jest.Mock).mockResolvedValue(users);

    const result = await listUsers({ tenantId: 1n }, deps);

    expect(deps.repository.listUsersByTenant).toHaveBeenCalledWith(1n);
    expect(deps.repository.listUsersByCompany).not.toHaveBeenCalled();
    expect(result).toBe(users);
  });

  it("lists by company when companyUuid is given", async () => {
    const deps = buildDeps();
    const users = [buildUser()];
    (deps.repository.listUsersByCompany as jest.Mock).mockResolvedValue(users);

    const result = await listUsers({ tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000010" }, deps);

    expect(deps.repository.listUsersByCompany).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000010");
    expect(deps.repository.listUsersByTenant).not.toHaveBeenCalled();
    expect(result).toBe(users);
  });
});
