import { updateTenantSubscription, UpdateTenantSubscriptionDeps } from "./update-tenant-subscription.service";
import { TenantNotFoundError, TenantSubscriptionNotFoundError } from "../domain/errors/organization.errors";
import { TenantSubscriptionStatus } from "../domain/enums/tenant-subscription-status.enum";
import { buildTenant, buildTenantSubscription, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): UpdateTenantSubscriptionDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("updateTenantSubscription", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateTenantSubscription({ tenantUuid: "missing-uuid", planCode: "PRO" }, deps),
    ).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.updateTenantSubscription).not.toHaveBeenCalled();
  });

  it("throws TenantSubscriptionNotFoundError when no subscription row exists yet", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(null);

    await expect(
      updateTenantSubscription({ tenantUuid: tenant.uuid, planCode: "PRO" }, deps),
    ).rejects.toThrow(TenantSubscriptionNotFoundError);
    expect(deps.repository.updateTenantSubscription).not.toHaveBeenCalled();
  });

  it("updates the subscription when the tenant and subscription row both exist", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const subscription = buildTenantSubscription();
    const updated = buildTenantSubscription({ planCode: "PRO", status: TenantSubscriptionStatus.Active });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(subscription);
    (deps.repository.updateTenantSubscription as jest.Mock).mockResolvedValue(updated);

    const result = await updateTenantSubscription(
      { tenantUuid: tenant.uuid, planCode: "PRO", status: TenantSubscriptionStatus.Active, updatedBy: 4n },
      deps,
    );

    expect(deps.repository.updateTenantSubscription).toHaveBeenCalledWith(tenant.id, {
      planCode: "PRO",
      subscribedModules: undefined,
      status: TenantSubscriptionStatus.Active,
      currentPeriodStartsAt: undefined,
      currentPeriodEndsAt: undefined,
      cancelledAt: undefined,
      updatedBy: 4n,
    });
    expect(result).toBe(updated);
  });
});
