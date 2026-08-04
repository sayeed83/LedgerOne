import { searchUsers, SearchUsersDeps } from "./search-users.service";
import { buildUser, createFakeUserManagementRepository } from "./test-support/fixtures";

function buildDeps(): SearchUsersDeps {
  return { repository: createFakeUserManagementRepository() };
}

describe("searchUsers", () => {
  it("forwards the trimmed query to the repository", async () => {
    const deps = buildDeps();
    const users = [buildUser()];
    (deps.repository.searchUsers as jest.Mock).mockResolvedValue(users);

    const result = await searchUsers({ tenantId: 1n, query: "  Mehta  " }, deps);

    expect(deps.repository.searchUsers).toHaveBeenCalledWith(1n, "Mehta");
    expect(result).toBe(users);
  });

  it("returns an empty array when nothing matches", async () => {
    const deps = buildDeps();
    (deps.repository.searchUsers as jest.Mock).mockResolvedValue([]);

    const result = await searchUsers({ tenantId: 1n, query: "nonexistent-xyz" }, deps);

    expect(result).toEqual([]);
  });
});
