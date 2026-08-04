import { getTenantSettings, GetTenantSettingsDeps } from "./get-tenant-settings.service";
import { TenantNotFoundError, TenantSettingsNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildTenantSettings, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): GetTenantSettingsDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("getTenantSettings", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getTenantSettings({ tenantUuid: "missing-uuid" }, deps)).rejects.toThrow(TenantNotFoundError);
  });

  it("throws TenantSettingsNotFoundError when no settings row exists yet", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(null);

    await expect(getTenantSettings({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      TenantSettingsNotFoundError,
    );
  });

  it("returns the settings row when found", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const settings = buildTenantSettings();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(settings);

    const result = await getTenantSettings({ tenantUuid: tenant.uuid }, deps);

    expect(deps.repository.getTenantSettings).toHaveBeenCalledWith(tenant.id);
    expect(result).toBe(settings);
  });
});
