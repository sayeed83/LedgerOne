import { getTenantSubscription, GetTenantSubscriptionDeps } from "./get-tenant-subscription.service";
import { TenantNotFoundError, TenantSubscriptionNotFoundError } from "../domain/errors/organization.errors";
import { buildTenant, buildTenantSubscription, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): GetTenantSubscriptionDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("getTenantSubscription", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getTenantSubscription({ tenantUuid: "missing-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("throws TenantSubscriptionNotFoundError when no subscription row exists yet", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(null);

    await expect(getTenantSubscription({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
      TenantSubscriptionNotFoundError,
    );
  });

  it("returns the subscription row when found", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const subscription = buildTenantSubscription();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(subscription);

    const result = await getTenantSubscription({ tenantUuid: tenant.uuid }, deps);

    expect(deps.repository.getTenantSubscription).toHaveBeenCalledWith(tenant.id);
    expect(result).toBe(subscription);
  });
});
