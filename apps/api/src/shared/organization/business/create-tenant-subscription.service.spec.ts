import { createTenantSubscription, CreateTenantSubscriptionDeps } from "./create-tenant-subscription.service";
import { TenantNotFoundError, TenantSubscriptionAlreadyExistsError } from "../domain/errors/organization.errors";
import { buildTenant, buildTenantSubscription, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): CreateTenantSubscriptionDeps {
  return { repository: createFakeOrganizationRepository() };
}

const PERIOD_START = new Date("2026-01-01T00:00:00.000Z");
const PERIOD_END = new Date("2026-12-31T23:59:59.999Z");

describe("createTenantSubscription", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      createTenantSubscription(
        {
          tenantUuid: "missing-uuid",
          planCode: "STANDARD",
          subscribedModules: ["accounting"],
          currentPeriodStartsAt: PERIOD_START,
          currentPeriodEndsAt: PERIOD_END,
        },
        deps,
      ),
    ).rejects.toThrow(TenantNotFoundError);
    expect(deps.repository.createTenantSubscription).not.toHaveBeenCalled();
  });

  it("throws TenantSubscriptionAlreadyExistsError when a subscription row already exists", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(buildTenantSubscription());

    await expect(
      createTenantSubscription(
        {
          tenantUuid: tenant.uuid,
          planCode: "STANDARD",
          subscribedModules: ["accounting"],
          currentPeriodStartsAt: PERIOD_START,
          currentPeriodEndsAt: PERIOD_END,
        },
        deps,
      ),
    ).rejects.toThrow(TenantSubscriptionAlreadyExistsError);
    expect(deps.repository.createTenantSubscription).not.toHaveBeenCalled();
  });

  it("creates a subscription when the tenant exists and no subscription row exists yet", async () => {
    const deps = buildDeps();
    const tenant = buildTenant();
    const created = buildTenantSubscription();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
    (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(null);
    (deps.repository.createTenantSubscription as jest.Mock).mockResolvedValue(created);

    const result = await createTenantSubscription(
      {
        tenantUuid: tenant.uuid,
        planCode: "STANDARD",
        subscribedModules: ["accounting", "inventory"],
        currentPeriodStartsAt: PERIOD_START,
        currentPeriodEndsAt: PERIOD_END,
        createdBy: 1n,
      },
      deps,
    );

    expect(deps.repository.createTenantSubscription).toHaveBeenCalledWith(tenant.id, {
      planCode: "STANDARD",
      subscribedModules: ["accounting", "inventory"],
      currentPeriodStartsAt: PERIOD_START,
      currentPeriodEndsAt: PERIOD_END,
      createdBy: 1n,
    });
    expect(result).toBe(created);
  });
});
