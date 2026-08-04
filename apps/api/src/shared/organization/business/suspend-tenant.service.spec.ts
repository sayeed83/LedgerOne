import { suspendTenant, SuspendTenantDeps } from "./suspend-tenant.service";
import { TenantNotFoundError, InvalidTenantStatusTransitionError } from "../domain/errors/organization.errors";
import { TenantStatus } from "../domain/enums/tenant-status.enum";
import { buildTenant, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): SuspendTenantDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("suspendTenant", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(suspendTenant({ tenantUuid: "missing-uuid" }, deps)).rejects.toThrow(TenantNotFoundError);
  });

  it("suspends an Active tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Active });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
      buildTenant({ status: TenantStatus.Suspended }),
    );

    const result = await suspendTenant({ tenantUuid: tenant.uuid, updatedBy: 9n }, deps);

    expect(deps.repository.updateTenantStatus).toHaveBeenCalledWith(tenant.id, TenantStatus.Suspended, 9n);
    expect(result.status).toBe(TenantStatus.Suspended);
  });

  it("rejects suspending a Provisioning tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Provisioning });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    await expect(suspendTenant({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      InvalidTenantStatusTransitionError,
    );
    expect(deps.repository.updateTenantStatus).not.toHaveBeenCalled();
  });

  it("rejects suspending a Deactivated tenant", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Deactivated });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    await expect(suspendTenant({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      InvalidTenantStatusTransitionError,
    );
  });
});
