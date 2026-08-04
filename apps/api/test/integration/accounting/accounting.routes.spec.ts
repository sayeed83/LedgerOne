// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Organization's, User Management's, and Authorization's own integration
// tests.
import express from "express";
import request from "supertest";
import { createAccountingRouter } from "../../../src/shared/accounting";
import { AccountingDependencies } from "../../../src/shared/accounting/business/accounting.composition";
import { FinancialYearStatus } from "../../../src/shared/accounting/domain/enums/financial-year-status.enum";
import { FiscalPeriodStatus } from "../../../src/shared/accounting/domain/enums/fiscal-period-status.enum";
import {
  buildFinancialYear,
  buildFiscalPeriod,
  createFakeAccountingRepository,
} from "../../../src/shared/accounting/business/test-support/fixtures";

function buildApp(deps: AccountingDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/accounting", createAccountingRouter(deps));
  return app;
}

function buildDeps(): AccountingDependencies {
  return { repository: createFakeAccountingRepository() };
}

const TENANT_HEADER = "1";
const COMPANY_UUID = "00000000-0000-0000-0000-000000000100";

describe("Accounting routes", () => {
  describe("POST /api/v1/accounting/financial-years", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/financial-years")
        .send({ companyUuid: COMPANY_UUID, startDate: "2026-04-01", endDate: "2027-03-31" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/financial-years")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when the range overlaps an existing Financial Year for the Company", async () => {
      const deps = buildDeps();
      (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([
        buildFinancialYear({ startDate: new Date("2026-01-01T00:00:00.000Z"), endDate: new Date("2026-12-31T00:00:00.000Z") }),
      ]);

      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/financial-years")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: COMPANY_UUID, startDate: "2026-04-01", endDate: "2027-03-31" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_OVERLAP");
    });

    it("returns 201 with the created Financial Year, exposing only its uuid/companyUuid (never id/tenantId/createdBy)", async () => {
      const deps = buildDeps();
      (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([]);
      const created = buildFinancialYear({ companyUuid: COMPANY_UUID });
      (deps.repository.createFinancialYear as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/financial-years")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: COMPANY_UUID, startDate: "2026-04-01", endDate: "2027-03-31" });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.companyUuid).toBe(COMPANY_UUID);
      expect(res.body.data.status).toBe(FinancialYearStatus.Future);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("GET /api/v1/accounting/financial-years", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/accounting/financial-years");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the tenant's Financial Years as an array", async () => {
      const deps = buildDeps();
      const years = [buildFinancialYear()];
      (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue(years);

      const res = await request(buildApp(deps))
        .get("/api/v1/accounting/financial-years")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(years[0].uuid);
    });

    it("passes ?companyUuid= through as a filter", async () => {
      const deps = buildDeps();
      (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([]);

      await request(buildApp(deps))
        .get("/api/v1/accounting/financial-years")
        .query({ companyUuid: COMPANY_UUID })
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(deps.repository.listFinancialYears).toHaveBeenCalledWith(1n, COMPANY_UUID);
    });
  });

  describe("GET /api/v1/accounting/financial-years/:financialYearUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/accounting/financial-years/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Financial Year does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/accounting/financial-years/${buildFinancialYear().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_NOT_FOUND");
    });

    it("returns 200 with the Financial Year", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear();
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

      const res = await request(buildApp(deps))
        .get(`/api/v1/accounting/financial-years/${financialYear.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(financialYear.uuid);
      expect(res.body.data.companyUuid).toBe(financialYear.companyUuid);
    });
  });

  describe("PUT /api/v1/accounting/financial-years/:financialYearUuid", () => {
    it("returns 404 when the Financial Year does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/accounting/financial-years/${buildFinancialYear().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ endDate: "2027-03-30" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_NOT_FOUND");
    });

    it("returns 409 when the revised range overlaps another Financial Year for the same Company", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({
        uuid: "00000000-0000-0000-0000-000000000001",
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        endDate: new Date("2027-03-31T00:00:00.000Z"),
      });
      const other = buildFinancialYear({
        uuid: "00000000-0000-0000-0000-000000000099",
        startDate: new Date("2027-04-01T00:00:00.000Z"),
        endDate: new Date("2028-03-31T00:00:00.000Z"),
      });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([financialYear, other]);

      const res = await request(buildApp(deps))
        .put(`/api/v1/accounting/financial-years/${financialYear.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ endDate: "2027-04-15" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_OVERLAP");
    });

    it("returns 200 with the updated Financial Year", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear();
      const updated = buildFinancialYear({ endDate: new Date("2027-03-30T00:00:00.000Z") });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([financialYear]);
      (deps.repository.updateFinancialYear as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/accounting/financial-years/${financialYear.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ endDate: "2027-03-30" });

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.endDate).toISOString()).toBe(new Date("2027-03-30T00:00:00.000Z").toISOString());
    });
  });

  describe("POST /api/v1/accounting/financial-years/:financialYearUuid/open", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status: FinancialYearStatus.Future });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.openFinancialYear as jest.Mock).mockResolvedValue(
        buildFinancialYear({ status: FinancialYearStatus.Open }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${financialYear.uuid}/open`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(FinancialYearStatus.Open);
    });

    it("returns 409 when the Financial Year is already Open", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status: FinancialYearStatus.Open });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${financialYear.uuid}/open`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_INVALID_FINANCIAL_YEAR_STATUS_TRANSITION");
    });

    it("returns 404 when the Financial Year does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${buildFinancialYear().uuid}/open`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_NOT_FOUND");
    });
  });

  describe("POST /api/v1/accounting/financial-years/:financialYearUuid/close", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status: FinancialYearStatus.Open });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.closeFinancialYear as jest.Mock).mockResolvedValue(
        buildFinancialYear({ status: FinancialYearStatus.Closed }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${financialYear.uuid}/close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(FinancialYearStatus.Closed);
    });

    it("returns 409 when the Financial Year is still Future", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status: FinancialYearStatus.Future });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${financialYear.uuid}/close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_INVALID_FINANCIAL_YEAR_STATUS_TRANSITION");
    });

    it("returns 404 when the Financial Year does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${buildFinancialYear().uuid}/close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_NOT_FOUND");
    });
  });

  describe("POST /api/v1/accounting/financial-years/:financialYearUuid/reopen", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status: FinancialYearStatus.Closed });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.reopenFinancialYear as jest.Mock).mockResolvedValue(
        buildFinancialYear({ status: FinancialYearStatus.Reopened }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${financialYear.uuid}/reopen`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(FinancialYearStatus.Reopened);
    });

    it("returns 409 when the Financial Year is not Closed", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status: FinancialYearStatus.Open });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${financialYear.uuid}/reopen`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_INVALID_FINANCIAL_YEAR_STATUS_TRANSITION");
    });

    it("returns 404 when the Financial Year does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/financial-years/${buildFinancialYear().uuid}/reopen`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_NOT_FOUND");
    });
  });

  describe("POST /api/v1/accounting/fiscal-periods", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/fiscal-periods")
        .send({ financialYearUuid: buildFinancialYear().uuid, startDate: "2026-04-01", endDate: "2026-04-30" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/fiscal-periods")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ financialYearUuid: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the parent Financial Year does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/fiscal-periods")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ financialYearUuid: buildFinancialYear().uuid, startDate: "2026-04-01", endDate: "2026-04-30" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FINANCIAL_YEAR_NOT_FOUND");
    });

    it("returns 409 when the range overlaps an existing Fiscal Period in the same Financial Year", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ id: 10n, uuid: "00000000-0000-0000-0000-000000000001" });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([
        buildFiscalPeriod({
          financialYearId: 10n,
          startDate: new Date("2026-04-15T00:00:00.000Z"),
          endDate: new Date("2026-05-15T00:00:00.000Z"),
        }),
      ]);

      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/fiscal-periods")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ financialYearUuid: financialYear.uuid, startDate: "2026-04-01", endDate: "2026-04-30" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_OVERLAP");
    });

    it("returns 201 with the created Fiscal Period, exposing only business fields (never id/tenantId/financialYearId/createdBy)", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ id: 10n, uuid: "00000000-0000-0000-0000-000000000001", companyUuid: COMPANY_UUID });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([]);
      const created = buildFiscalPeriod({ companyUuid: COMPANY_UUID, financialYearId: 10n });
      (deps.repository.createFiscalPeriod as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/accounting/fiscal-periods")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ financialYearUuid: financialYear.uuid, startDate: "2026-04-01", endDate: "2026-04-30" });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.companyUuid).toBe(COMPANY_UUID);
      expect(res.body.data.status).toBe(FiscalPeriodStatus.Open);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.financialYearId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("GET /api/v1/accounting/fiscal-periods", () => {
    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/accounting/fiscal-periods");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the tenant's Fiscal Periods as an array", async () => {
      const deps = buildDeps();
      const periods = [buildFiscalPeriod()];
      (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue(periods);

      const res = await request(buildApp(deps))
        .get("/api/v1/accounting/fiscal-periods")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(periods[0].uuid);
    });

    it("resolves ?financialYearUuid= to its internal id before filtering", async () => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ id: 10n, uuid: "00000000-0000-0000-0000-000000000001" });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([]);

      await request(buildApp(deps))
        .get("/api/v1/accounting/fiscal-periods")
        .query({ financialYearUuid: financialYear.uuid })
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(deps.repository.listFiscalPeriods).toHaveBeenCalledWith(1n, 10n);
    });
  });

  describe("GET /api/v1/accounting/fiscal-periods/:fiscalPeriodUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/accounting/fiscal-periods/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Fiscal Period does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/accounting/fiscal-periods/${buildFiscalPeriod().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_NOT_FOUND");
    });

    it("returns 200 with the Fiscal Period", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod();
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      const res = await request(buildApp(deps))
        .get(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(fiscalPeriod.uuid);
      expect(res.body.data.companyUuid).toBe(fiscalPeriod.companyUuid);
    });
  });

  describe("PUT /api/v1/accounting/fiscal-periods/:fiscalPeriodUuid", () => {
    it("returns 404 when the Fiscal Period does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/accounting/fiscal-periods/${buildFiscalPeriod().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ endDate: "2026-04-29" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_NOT_FOUND");
    });

    it("returns 409 when the Fiscal Period is Closed", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Closed });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      const res = await request(buildApp(deps))
        .put(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ endDate: "2026-04-29" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_CLOSED");
    });

    it("returns 409 when the revised range overlaps another Fiscal Period in the same Financial Year", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({
        uuid: "00000000-0000-0000-0000-000000000010",
        financialYearId: 10n,
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        endDate: new Date("2026-04-30T00:00:00.000Z"),
      });
      const other = buildFiscalPeriod({
        uuid: "00000000-0000-0000-0000-000000000099",
        financialYearId: 10n,
        startDate: new Date("2026-05-01T00:00:00.000Z"),
        endDate: new Date("2026-05-31T00:00:00.000Z"),
      });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
      (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([fiscalPeriod, other]);

      const res = await request(buildApp(deps))
        .put(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ endDate: "2026-05-10" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_OVERLAP");
    });

    it("returns 200 with the updated Fiscal Period", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod();
      const updated = buildFiscalPeriod({ endDate: new Date("2026-04-29T00:00:00.000Z") });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
      (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([fiscalPeriod]);
      (deps.repository.updateFiscalPeriod as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ endDate: "2026-04-29" });

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.endDate).toISOString()).toBe(new Date("2026-04-29T00:00:00.000Z").toISOString());
    });
  });

  describe("POST /api/v1/accounting/fiscal-periods/:fiscalPeriodUuid/soft-close", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Open });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
      (deps.repository.softCloseFiscalPeriod as jest.Mock).mockResolvedValue(
        buildFiscalPeriod({ status: FiscalPeriodStatus.SoftClosed }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}/soft-close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(FiscalPeriodStatus.SoftClosed);
    });

    it("returns 409 when the Fiscal Period is not Open", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Closed });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}/soft-close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_INVALID_FISCAL_PERIOD_STATUS_TRANSITION");
    });

    it("returns 404 when the Fiscal Period does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${buildFiscalPeriod().uuid}/soft-close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_NOT_FOUND");
    });
  });

  describe("POST /api/v1/accounting/fiscal-periods/:fiscalPeriodUuid/close", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.SoftClosed });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
      (deps.repository.closeFiscalPeriod as jest.Mock).mockResolvedValue(
        buildFiscalPeriod({ status: FiscalPeriodStatus.Closed }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}/close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(FiscalPeriodStatus.Closed);
    });

    it("returns 409 when the Fiscal Period is still Open", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Open });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}/close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_INVALID_FISCAL_PERIOD_STATUS_TRANSITION");
    });

    it("returns 404 when the Fiscal Period does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${buildFiscalPeriod().uuid}/close`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_NOT_FOUND");
    });
  });

  describe("POST /api/v1/accounting/fiscal-periods/:fiscalPeriodUuid/reopen", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Closed });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
      (deps.repository.reopenFiscalPeriod as jest.Mock).mockResolvedValue(
        buildFiscalPeriod({ status: FiscalPeriodStatus.Reopened }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}/reopen`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(FiscalPeriodStatus.Reopened);
    });

    it("returns 409 when the Fiscal Period is not Closed", async () => {
      const deps = buildDeps();
      const fiscalPeriod = buildFiscalPeriod({ status: FiscalPeriodStatus.Open });
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${fiscalPeriod.uuid}/reopen`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACC_INVALID_FISCAL_PERIOD_STATUS_TRANSITION");
    });

    it("returns 404 when the Fiscal Period does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post(`/api/v1/accounting/fiscal-periods/${buildFiscalPeriod().uuid}/reopen`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ACC_FISCAL_PERIOD_NOT_FOUND");
    });
  });
});
