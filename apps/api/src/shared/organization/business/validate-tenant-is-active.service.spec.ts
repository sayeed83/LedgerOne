import { validateTenantIsActive, ValidateTenantIsActiveDeps } from "./validate-tenant-is-active.service";
import { TenantNotActiveError, TenantNotFoundError } from "../domain/errors/organization.errors";
import { TenantStatus } from "../domain/enums/tenant-status.enum";
import { buildTenant, createFakeOrganizationRepository } from "./test-support/fixtures";

function buildDeps(): ValidateTenantIsActiveDeps {
  return { repository: createFakeOrganizationRepository() };
}

describe("validateTenantIsActive", () => {
  it("throws TenantNotFoundError when the tenant does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

    await expect(validateTenantIsActive({ tenantUuid: "missing-uuid" }, deps)).rejects.toThrow(
      TenantNotFoundError,
    );
  });

  it("returns the tenant when it is Active", async () => {
    const deps = buildDeps();
    const tenant = buildTenant({ status: TenantStatus.Active });
    (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

    const result = await validateTenantIsActive({ tenantUuid: tenant.uuid }, deps);

    expect(result).toBe(tenant);
  });

  it.each([TenantStatus.Provisioning, TenantStatus.Suspended, TenantStatus.Deactivated])(
    "throws TenantNotActiveError when the tenant status is %s",
    async (status) => {
      const deps = buildDeps();
      const tenant = buildTenant({ status });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

      await expect(validateTenantIsActive({ tenantUuid: tenant.uuid }, deps)).rejects.toThrow(
        TenantNotActiveError,
      );
    },
  );
});
