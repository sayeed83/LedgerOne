import { createTenant, CreateTenantDeps } from "./create-tenant.service";
import { buildTenant, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): CreateTenantDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("createTenant", () => {
  it("persists a new Tenant via the repository and returns it", async () => {
    const deps = buildDeps();
    const created = buildTenant();
    (deps.repository.createTenant as jest.Mock).mockResolvedValue(created);

    const result = await createTenant(
      { legalName: "Acme Trading Pvt. Ltd.", primaryContactEmail: "admin@acme.example.com" },
      deps,
    );

    expect(deps.repository.createTenant).toHaveBeenCalledWith({
      legalName: "Acme Trading Pvt. Ltd.",
      primaryContactEmail: "admin@acme.example.com",
      createdBy: null,
    });
    expect(result).toBe(created);
  });

  it("passes createdBy through when supplied", async () => {
    const deps = buildDeps();
    (deps.repository.createTenant as jest.Mock).mockResolvedValue(buildTenant());

    await createTenant(
      { legalName: "Acme Trading Pvt. Ltd.", primaryContactEmail: "admin@acme.example.com", createdBy: 7n },
      deps,
    );

    expect(deps.repository.createTenant).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 7n }),
    );
  });
});
