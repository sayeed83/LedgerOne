import { deactivateTenant, DeactivateTenantDeps } from "./deactivate-tenant.service";
import { TenantNotFoundError, InvalidTenantStatusTransitionError } from "../domain/errors/organization.errors";
import { TenantStatus } from "../domain/enums/tenant-status.enum";
import { buildTenant, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): DeactivateTenantDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("deactivateTenant", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(deactivateTenant({ tenantUuid: "missing-uuid" }, deps)).rejects.toThrow(TenantNotFoundError);
  });

  it("deactivates an Active tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Active });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
      buildTenant({ status: TenantStatus.Deactivated }),
    );

    const result = await deactivateTenant({ tenantUuid: tenant.uuid }, deps);

    expect(deps.repository.updateTenantStatus).toHaveBeenCalledWith(tenant.id, TenantStatus.Deactivated, null);
    expect(result.status).toBe(TenantStatus.Deactivated);
  });

  it("deactivates a Suspended tenant (grace period expired)", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Suspended });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
      buildTenant({ status: TenantStatus.Deactivated }),
    );

    await deactivateTenant({ tenantUuid: tenant.uuid }, deps);

    expect(deps.repository.updateTenantStatus).toHaveBeenCalledWith(tenant.id, TenantStatus.Deactivated, null);
  });

  it("rejects deactivating a Provisioning tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Provisioning });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    await expect(deactivateTenant({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      InvalidTenantStatusTransitionError,
    );
  });

  it("rejects deactivating an already-Deactivated tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Deactivated });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    await expect(deactivateTenant({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      InvalidTenantStatusTransitionError,
    );
  });
});
