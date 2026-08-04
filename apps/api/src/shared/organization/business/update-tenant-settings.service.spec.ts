import { updateTenantSettings, UpdateTenantSettingsDeps } from "./update-tenant-settings.service";
import { TenantNotFoundError, TenantSettingsNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildTenantSettings, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): UpdateTenantSettingsDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("updateTenantSettings", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateTenantSettings({ tenantUuid: "missing-uuid", defaultCurrencyCode: "INR" }, deps),
    ).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.updateTenantSettings).not.toHaveBeenCalled();
  });

  it("throws TenantSettingsNotFoundError when no settings row exists yet", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(null);

    await expect(
      updateTenantSettings({ tenantUuid: tenant.uuid, defaultCurrencyCode: "INR" }, deps),
    ).rejects.toThrow(TenantSettingsNotFoundError);
    expect(deps.repository.updateTenantSettings).not.toHaveBeenCalled();
  });

  it("updates settings when the tenant and settings row both exist", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const settings = buildTenantSettings();
    const updated = buildTenantSettings({ defaultCurrencyCode: "INR" });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(settings);
    (deps.repository.updateTenantSettings as jest.Mock).mockResolvedValue(updated);

    const result = await updateTenantSettings(
      { tenantUuid: tenant.uuid, defaultCurrencyCode: "INR", updatedBy: 2n },
      deps,
    );

    expect(deps.repository.updateTenantSettings).toHaveBeenCalledWith(tenant.id, {
      defaultCurrencyCode: "INR",
      defaultTimeZone: undefined,
      defaultFinancialYearPattern: undefined,
      updatedBy: 2n,
    });
    expect(result).toBe(updated);
  });
});
