import { activateTenant, ActivateTenantDeps } from "./activate-tenant.service";
import { TenantNotFoundError, InvalidTenantStatusTransitionError } from "../domain/errors/organization.errors";
import { TenantStatus } from "../domain/enums/tenant-status.enum";
import { buildTenant, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): ActivateTenantDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("activateTenant", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(activateTenant({ tenantUuid: "missing-uuid" }, deps)).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.updateTenantStatus).not.toHaveBeenCalled();
  });

  it("activates a Provisioning tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Provisioning });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
      buildTenant({ status: TenantStatus.Active }),
    );

    const result = await activateTenant({ tenantUuid: tenant.uuid, updatedBy: 3n }, deps);

    expect(deps.repository.updateTenantStatus).toHaveBeenCalledWith(tenant.id, TenantStatus.Active, 3n);
    expect(result.status).toBe(TenantStatus.Active);
  });

  it("activates a Suspended tenant (reinstatement)", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Suspended });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
      buildTenant({ status: TenantStatus.Active }),
    );

    await activateTenant({ tenantUuid: tenant.uuid }, deps);

    expect(deps.repository.updateTenantStatus).toHaveBeenCalledWith(tenant.id, TenantStatus.Active, null);
  });

  it("rejects activating an already-Active tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Active });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    await expect(activateTenant({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      InvalidTenantStatusTransitionError,
    );
    expect(deps.repository.updateTenantStatus).not.toHaveBeenCalled();
  });

  it("rejects activating a Deactivated tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Deactivated });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    await expect(activateTenant({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      InvalidTenantStatusTransitionError,
    );
  });
});
