import { Tenant } from "./tenant.aggregate";
import { TenantStatus } from "../enums/tenant-status.enum";
import { InvalidTenantStatusTransitionError } from "../errors/organization.errors";

function buildTenant(status: TenantStatus): Tenant {
  return new Tenant(
    1n,
    "00000000-0000-0000-0000-000000000001",
    "Acme Trading Pvt. Ltd.",
    "admin@acme.example.com",
    status,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
}

describe("Tenant lifecycle transitions (00_BUSINESS_RULES.md Ch.1.6)", () => {
  describe("activate", () => {
    it("allows Provisioning -> Active", () => {
      const result = buildTenant(TenantStatus.Provisioning).activate();
      expect(result.status).toBe(TenantStatus.Active);
    });

    it("allows Suspended -> Active", () => {
      const result = buildTenant(TenantStatus.Suspended).activate();
      expect(result.status).toBe(TenantStatus.Active);
    });

    it("rejects Active -> Active", () => {
      expect(() => buildTenant(TenantStatus.Active).activate()).toThrow(InvalidTenantStatusTransitionError);
    });

    it("rejects Deactivated -> Active", () => {
      expect(() => buildTenant(TenantStatus.Deactivated).activate()).toThrow(InvalidTenantStatusTransitionError);
    });

    it("does not mutate the original instance", () => {
      const original = buildTenant(TenantStatus.Provisioning);
      original.activate();
      expect(original.status).toBe(TenantStatus.Provisioning);
    });
  });

  describe("suspend", () => {
    it("allows Active -> Suspended", () => {
      const result = buildTenant(TenantStatus.Active).suspend();
      expect(result.status).toBe(TenantStatus.Suspended);
    });

    it("rejects Provisioning -> Suspended", () => {
      expect(() => buildTenant(TenantStatus.Provisioning).suspend()).toThrow(InvalidTenantStatusTransitionError);
    });

    it("rejects Deactivated -> Suspended", () => {
      expect(() => buildTenant(TenantStatus.Deactivated).suspend()).toThrow(InvalidTenantStatusTransitionError);
    });
  });

  describe("deactivate", () => {
    it("allows Active -> Deactivated", () => {
      const result = buildTenant(TenantStatus.Active).deactivate();
      expect(result.status).toBe(TenantStatus.Deactivated);
    });

    it("allows Suspended -> Deactivated", () => {
      const result = buildTenant(TenantStatus.Suspended).deactivate();
      expect(result.status).toBe(TenantStatus.Deactivated);
    });

    it("rejects Provisioning -> Deactivated", () => {
      expect(() => buildTenant(TenantStatus.Provisioning).deactivate()).toThrow(InvalidTenantStatusTransitionError);
    });

    it("rejects Deactivated -> Deactivated (terminal state)", () => {
      expect(() => buildTenant(TenantStatus.Deactivated).deactivate()).toThrow(InvalidTenantStatusTransitionError);
    });
  });
});
