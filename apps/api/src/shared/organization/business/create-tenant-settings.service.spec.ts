import { createTenantSettings, CreateTenantSettingsDeps } from "./create-tenant-settings.service";
import { TenantNotFoundError, TenantSettingsAlreadyExistsError } from "../domain/errors/organization.errors";
import { buildTenant, buildTenantSettings, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): CreateTenantSettingsDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("createTenantSettings", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      createTenantSettings(
        {
          tenantUuid: "missing-uuid",
          defaultCurrencyCode: "USD",
          defaultTimeZone: "UTC",
          defaultFinancialYearPattern: "APR-MAR",
        },
        deps,
      ),
    ).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.createTenantSettings).not.toHaveBeenCalled();
  });

  it("throws TenantSettingsAlreadyExistsError when a settings row already exists", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(buildTenantSettings());

    await expect(
      createTenantSettings(
        {
          tenantUuid: tenant.uuid,
          defaultCurrencyCode: "USD",
          defaultTimeZone: "UTC",
          defaultFinancialYearPattern: "APR-MAR",
        },
        deps,
      ),
    ).rejects.toThrow(TenantSettingsAlreadyExistsError);
    expect(deps.repository.createTenantSettings).not.toHaveBeenCalled();
  });

  it("creates settings when the tenant exists and no settings row exists yet", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const created = buildTenantSettings();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(null);
    (deps.repository.createTenantSettings as jest.Mock).mockResolvedValue(created);

    const result = await createTenantSettings(
      {
        tenantUuid: tenant.uuid,
        defaultCurrencyCode: "USD",
        defaultTimeZone: "UTC",
        defaultFinancialYearPattern: "APR-MAR",
        createdBy: 1n,
      },
      deps,
    );

    expect(deps.repository.createTenantSettings).toHaveBeenCalledWith(tenant.id, {
      defaultCurrencyCode: "USD",
      defaultTimeZone: "UTC",
      defaultFinancialYearPattern: "APR-MAR",
      createdBy: 1n,
    });
    expect(result).toBe(created);
  });
});
