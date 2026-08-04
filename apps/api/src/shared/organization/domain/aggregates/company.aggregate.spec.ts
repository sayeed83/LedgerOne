import { Company } from "./company.aggregate";
import { CompanyStatus } from "../enums/company-status.enum";
import { InvalidCompanyStatusTransitionError } from "../errors/organization.errors";

function buildCompany(status: CompanyStatus): Company {
  return new Company(
    1n,
    "00000000-0000-0000-0000-000000000010",
    1n,
    "CO-001",
    "Acme Trading Pvt. Ltd.",
    "Acme Trading",
    "PRIVATE_LIMITED",
    "TAX-001",
    "USD",
    "US",
    "UTC",
    4,
    1,
    status,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
}

describe("Company lifecycle transitions (00_BUSINESS_RULES.md Ch.2.6)", () => {
  describe("activate", () => {
    it("allows Draft -> Active", () => {
      const result = buildCompany(CompanyStatus.Draft).activate();
      expect(result.status).toBe(CompanyStatus.Active);
    });

    it("allows Closed -> Active (reopening)", () => {
      const result = buildCompany(CompanyStatus.Closed).activate();
      expect(result.status).toBe(CompanyStatus.Active);
    });

    it("rejects Active -> Active", () => {
      expect(() => buildCompany(CompanyStatus.Active).activate()).toThrow(InvalidCompanyStatusTransitionError);
    });

    it("rejects Dissolved -> Active", () => {
      expect(() => buildCompany(CompanyStatus.Dissolved).activate()).toThrow(InvalidCompanyStatusTransitionError);
    });

    it("does not mutate the original instance", () => {
      const original = buildCompany(CompanyStatus.Draft);
      original.activate();
      expect(original.status).toBe(CompanyStatus.Draft);
    });
  });

  describe("close", () => {
    it("allows Active -> Closed", () => {
      const result = buildCompany(CompanyStatus.Active).close();
      expect(result.status).toBe(CompanyStatus.Closed);
    });

    it("rejects Draft -> Closed", () => {
      expect(() => buildCompany(CompanyStatus.Draft).close()).toThrow(InvalidCompanyStatusTransitionError);
    });

    it("rejects Closed -> Closed", () => {
      expect(() => buildCompany(CompanyStatus.Closed).close()).toThrow(InvalidCompanyStatusTransitionError);
    });

    it("rejects Dissolved -> Closed", () => {
      expect(() => buildCompany(CompanyStatus.Dissolved).close()).toThrow(InvalidCompanyStatusTransitionError);
    });
  });
});
