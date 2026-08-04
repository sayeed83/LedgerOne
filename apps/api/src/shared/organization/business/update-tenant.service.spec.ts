import { updateTenant, UpdateTenantDeps } from "./update-tenant.service";
import { TenantNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): UpdateTenantDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("updateTenant", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(updateTenant({ tenantUuid: "missing-uuid", legalName: "New Name" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
    expect(deps.repository.updateTenant).not.toHaveBeenCalled();
  });

  it("resolves the internal id via uuid and updates the tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const updated = buildTenant({ legalName: "Acme Group" });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.updateTenant as jest.Mock).mockResolvedValue(updated);

    const result = await updateTenant(
      { tenantUuid: tenant.uuid, legalName: "Acme Group", updatedBy: 5n },
      deps,
    );

    expect(deps.repository.updateTenant).toHaveBeenCalledWith(tenant.id, {
      legalName: "Acme Group",
      primaryContactEmail: undefined,
      updatedBy: 5n,
    });
    expect(result).toBe(updated);
  });
});
