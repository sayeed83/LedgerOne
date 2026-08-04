// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Authentication's own integration test.
import express from "express";
import request from "supertest";
import { createOrganizationRouter } from "../../../src/shared/organization";
import { OrganizationDependencies } from "../../../src/shared/organization/business/organization.composition";
import { TenantStatus } from "../../../src/shared/organization/domain/enums/tenant-status.enum";
import { TenantSubscriptionStatus } from "../../../src/shared/organization/domain/enums/tenant-subscription-status.enum";
import { CompanyStatus } from "../../../src/shared/organization/domain/enums/company-status.enum";
import {
  buildTenant,
  buildTenantSettings,
  buildTenantSubscription,
  buildCompany,
  buildBranch,
  buildDepartment,
  createFakeOrganizationRepository,
} from "../../../src/shared/organization/business/test-support/fixtures";

function buildApp(deps: OrganizationDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/organization", createOrganizationRouter(deps));
  return app;
}

function buildDeps(): OrganizationDependencies {
  return { repository: createFakeOrganizationRepository() };
}

describe("Organization routes", () => {
  describe("POST /api/v1/organization/tenants", () => {
    it("returns 422 on malformed input", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/organization/tenants").send({ legalName: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 201 with the created tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.createTenant as jest.Mock).mockResolvedValue(tenant);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/tenants")
        .send({ legalName: tenant.legalName, primaryContactEmail: tenant.primaryContactEmail });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(tenant.uuid);
      expect(res.body.data.status).toBe(TenantStatus.Provisioning);
      expect(res.body.data.id).toBeUndefined();
    });
  });

  describe("GET /api/v1/organization/tenants/:tenantUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/organization/tenants/not-a-uuid");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the tenant does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps)).get(`/api/v1/organization/tenants/${buildTenant().uuid}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("returns 200 with the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

      const res = await request(buildApp(deps)).get(`/api/v1/organization/tenants/${tenant.uuid}`);

      expect(res.status).toBe(200);
      expect(res.body.data.legalName).toBe(tenant.legalName);
    });
  });

  describe("PUT /api/v1/organization/tenants/:tenantUuid", () => {
    it("returns 404 when the tenant does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/tenants/${buildTenant().uuid}`)
        .send({ legalName: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("returns 200 with the updated tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const updated = buildTenant({ legalName: "Acme Group" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.updateTenant as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/tenants/${tenant.uuid}`)
        .send({ legalName: "Acme Group" });

      expect(res.status).toBe(200);
      expect(res.body.data.legalName).toBe("Acme Group");
    });
  });

  describe("POST /api/v1/organization/tenants/:tenantUuid/activate", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant({ status: TenantStatus.Provisioning });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
        buildTenant({ status: TenantStatus.Active }),
      );

      const res = await request(buildApp(deps)).post(`/api/v1/organization/tenants/${tenant.uuid}/activate`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.Active);
    });

    it("returns 409 when the transition is illegal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant({ status: TenantStatus.Active });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

      const res = await request(buildApp(deps)).post(`/api/v1/organization/tenants/${tenant.uuid}/activate`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_INVALID_STATUS_TRANSITION");
    });
  });

  describe("POST /api/v1/organization/tenants/:tenantUuid/suspend", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant({ status: TenantStatus.Active });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
        buildTenant({ status: TenantStatus.Suspended }),
      );

      const res = await request(buildApp(deps)).post(`/api/v1/organization/tenants/${tenant.uuid}/suspend`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.Suspended);
    });

    it("returns 409 when the transition is illegal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant({ status: TenantStatus.Provisioning });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);

      const res = await request(buildApp(deps)).post(`/api/v1/organization/tenants/${tenant.uuid}/suspend`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_INVALID_STATUS_TRANSITION");
    });
  });

  describe("POST /api/v1/organization/tenants/:tenantUuid/deactivate", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant({ status: TenantStatus.Suspended });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.updateTenantStatus as jest.Mock).mockResolvedValue(
        buildTenant({ status: TenantStatus.Deactivated }),
      );

      const res = await request(buildApp(deps)).post(`/api/v1/organization/tenants/${tenant.uuid}/deactivate`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantStatus.Deactivated);
    });

    it("returns 404 when the tenant does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps)).post(`/api/v1/organization/tenants/${buildTenant().uuid}/deactivate`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });
  });

  describe("GET /api/v1/organization/tenants/:tenantUuid/settings", () => {
    it("returns 404 when the settings row does not exist yet", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps)).get(`/api/v1/organization/tenants/${tenant.uuid}/settings`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_SETTINGS_NOT_FOUND");
    });

    it("returns 200 with the settings", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const settings = buildTenantSettings();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(settings);

      const res = await request(buildApp(deps)).get(`/api/v1/organization/tenants/${tenant.uuid}/settings`);

      expect(res.status).toBe(200);
      expect(res.body.data.defaultCurrencyCode).toBe(settings.defaultCurrencyCode);
    });
  });

  describe("PUT /api/v1/organization/tenants/:tenantUuid/settings", () => {
    it("returns 200 with the updated settings", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const settings = buildTenantSettings();
      const updated = buildTenantSettings({ defaultCurrencyCode: "INR" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.getTenantSettings as jest.Mock).mockResolvedValue(settings);
      (deps.repository.updateTenantSettings as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/tenants/${tenant.uuid}/settings`)
        .send({ defaultCurrencyCode: "INR" });

      expect(res.status).toBe(200);
      expect(res.body.data.defaultCurrencyCode).toBe("INR");
    });

    it("returns 422 for a malformed currency code", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/tenants/${buildTenant().uuid}/settings`)
        .send({ defaultCurrencyCode: "US" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/organization/tenants/:tenantUuid/subscription", () => {
    it("returns 404 when the subscription row does not exist yet", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps)).get(`/api/v1/organization/tenants/${tenant.uuid}/subscription`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_SUBSCRIPTION_NOT_FOUND");
    });

    it("returns 200 with the subscription", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const subscription = buildTenantSubscription();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(subscription);

      const res = await request(buildApp(deps)).get(`/api/v1/organization/tenants/${tenant.uuid}/subscription`);

      expect(res.status).toBe(200);
      expect(res.body.data.planCode).toBe(subscription.planCode);
    });
  });

  describe("PUT /api/v1/organization/tenants/:tenantUuid/subscription", () => {
    it("returns 200 with the updated subscription", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const subscription = buildTenantSubscription();
      const updated = buildTenantSubscription({ status: TenantSubscriptionStatus.Active });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.getTenantSubscription as jest.Mock).mockResolvedValue(subscription);
      (deps.repository.updateTenantSubscription as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/tenants/${tenant.uuid}/subscription`)
        .send({ status: TenantSubscriptionStatus.Active });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(TenantSubscriptionStatus.Active);
    });

    it("returns 422 for an invalid status value", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/tenants/${buildTenant().uuid}/subscription`)
        .send({ status: "NOT_A_REAL_STATUS" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/organization/companies", () => {
    function validBody(overrides: Record<string, unknown> = {}) {
      return {
        companyCode: "CO-002",
        legalName: "Beta Industries Ltd.",
        taxRegistrationNumber: "TAX-002",
        baseCurrencyCode: "USD",
        country: "US",
        timeZone: "UTC",
        financialYearStartMonth: 4,
        financialYearStartDay: 1,
        ...overrides,
      };
    }

    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/organization/companies").send(validBody());

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const res = await request(buildApp(deps))
        .post("/api/v1/organization/companies")
        .set("X-Tenant-Id", tenant.uuid)
        .send({ companyCode: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the tenant does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/companies")
        .set("X-Tenant-Id", buildTenant().uuid)
        .send(validBody());

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("returns 409 when the company code is already in use within the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue([
        buildCompany({ companyCode: "CO-002" }),
      ]);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/companies")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody({ companyCode: "CO-002" }));

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_DUPLICATE_COMPANY_CODE");
    });

    it("returns 201 with the created company", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany({ companyCode: "CO-002" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue([]);
      (deps.repository.createCompany as jest.Mock).mockResolvedValue(company);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/companies")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody());

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(company.uuid);
      expect(res.body.data.companyCode).toBe("CO-002");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
    });
  });

  describe("GET /api/v1/organization/companies/:companyUuid", () => {
    it("returns 422 for a malformed companyUuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/organization/companies/not-a-uuid")
        .set("X-Tenant-Id", buildTenant().uuid);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the company does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/companies/${buildCompany().uuid}`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_COMPANY_NOT_FOUND");
    });

    it("returns 200 with the company", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/companies/${company.uuid}`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(200);
      expect(res.body.data.companyCode).toBe(company.companyCode);
    });
  });

  describe("PUT /api/v1/organization/companies/:companyUuid", () => {
    it("returns 404 when the company does not exist under the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/companies/${buildCompany().uuid}`)
        .set("X-Tenant-Id", tenant.uuid)
        .send({ legalName: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_COMPANY_NOT_FOUND");
    });

    it("returns 200 with the updated company", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      const updated = buildCompany({ legalName: "Acme Renamed" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.updateCompany as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/companies/${company.uuid}`)
        .set("X-Tenant-Id", tenant.uuid)
        .send({ legalName: "Acme Renamed" });

      expect(res.status).toBe(200);
      expect(res.body.data.legalName).toBe("Acme Renamed");
    });
  });

  describe("POST /api/v1/organization/companies/:companyUuid/activate", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany({ status: CompanyStatus.Draft });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.activateCompany as jest.Mock).mockResolvedValue(
        buildCompany({ status: CompanyStatus.Active }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/organization/companies/${company.uuid}/activate`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(CompanyStatus.Active);
    });

    it("returns 409 when the transition is illegal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany({ status: CompanyStatus.Active });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

      const res = await request(buildApp(deps))
        .post(`/api/v1/organization/companies/${company.uuid}/activate`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_INVALID_COMPANY_STATUS_TRANSITION");
    });
  });

  describe("POST /api/v1/organization/companies/:companyUuid/close", () => {
    it("returns 200 when the transition is legal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany({ status: CompanyStatus.Active });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.deactivateCompany as jest.Mock).mockResolvedValue(
        buildCompany({ status: CompanyStatus.Closed }),
      );

      const res = await request(buildApp(deps))
        .post(`/api/v1/organization/companies/${company.uuid}/close`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(CompanyStatus.Closed);
    });

    it("returns 409 when the transition is illegal", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany({ status: CompanyStatus.Draft });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);

      const res = await request(buildApp(deps))
        .post(`/api/v1/organization/companies/${company.uuid}/close`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_INVALID_COMPANY_STATUS_TRANSITION");
    });
  });

  describe("GET /api/v1/organization/tenants/:tenantUuid/companies", () => {
    it("returns 404 when the tenant does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps)).get(
        `/api/v1/organization/tenants/${buildTenant().uuid}/companies`,
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_TENANT_NOT_FOUND");
    });

    it("returns 200 with every company scoped to the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const companies = [buildCompany({ uuid: "co-a" }), buildCompany({ uuid: "co-b" })];
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.listCompaniesByTenant as jest.Mock).mockResolvedValue(companies);

      const res = await request(buildApp(deps)).get(`/api/v1/organization/tenants/${tenant.uuid}/companies`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/v1/organization/branches", () => {
    function validBody(overrides: Record<string, unknown> = {}) {
      return {
        companyUuid: buildCompany().uuid,
        branchCode: "BR-002",
        branchName: "Downtown Branch",
        addressLine1: "456 Market St",
        city: "Metropolis",
        countryCode: "US",
        timeZone: "UTC",
        ...overrides,
      };
    }

    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/organization/branches").send(validBody());

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the company does not exist under the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/branches")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody());

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_COMPANY_NOT_FOUND");
    });

    it("returns 409 when the branch code is already in use within the company", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue([
        buildBranch({ branchCode: "BR-002" }),
      ]);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/branches")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody({ companyUuid: company.uuid, branchCode: "BR-002" }));

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_DUPLICATE_BRANCH_CODE");
    });

    it("returns 201 with the created branch", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      const branch = buildBranch({ branchCode: "BR-002" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue([]);
      (deps.repository.createBranch as jest.Mock).mockResolvedValue(branch);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/branches")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody({ companyUuid: company.uuid }));

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(branch.uuid);
      expect(res.body.data.branchCode).toBe("BR-002");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.companyId).toBeUndefined();
    });
  });

  describe("GET /api/v1/organization/branches/:branchUuid", () => {
    it("returns 404 when the branch does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/branches/${buildBranch().uuid}`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_BRANCH_NOT_FOUND");
    });

    it("returns 200 with the branch", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const branch = buildBranch();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(branch);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/branches/${branch.uuid}`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(200);
      expect(res.body.data.branchCode).toBe(branch.branchCode);
    });
  });

  describe("PUT /api/v1/organization/branches/:branchUuid", () => {
    it("returns 404 when the branch does not exist under the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/branches/${buildBranch().uuid}`)
        .set("X-Tenant-Id", tenant.uuid)
        .send({ branchName: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_BRANCH_NOT_FOUND");
    });

    it("returns 200 with the updated branch", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const branch = buildBranch();
      const updated = buildBranch({ branchName: "Renamed Branch" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findBranchByUuid as jest.Mock).mockResolvedValue(branch);
      (deps.repository.updateBranch as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/branches/${branch.uuid}`)
        .set("X-Tenant-Id", tenant.uuid)
        .send({ branchName: "Renamed Branch" });

      expect(res.status).toBe(200);
      expect(res.body.data.branchName).toBe("Renamed Branch");
    });
  });

  describe("GET /api/v1/organization/companies/:companyUuid/branches", () => {
    it("returns 404 when the company does not exist under the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/companies/${buildCompany().uuid}/branches`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_COMPANY_NOT_FOUND");
    });

    it("returns 200 with every branch scoped to the company", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      const branches = [buildBranch({ uuid: "br-a" }), buildBranch({ uuid: "br-b" })];
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.listBranchesByCompany as jest.Mock).mockResolvedValue(branches);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/companies/${company.uuid}/branches`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/v1/organization/departments", () => {
    function validBody(overrides: Record<string, unknown> = {}) {
      return {
        companyUuid: buildCompany().uuid,
        departmentCode: "DPT-002",
        departmentName: "Operations",
        ...overrides,
      };
    }

    it("returns 422 when the X-Tenant-Id header is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/organization/departments").send(validBody());

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the company does not exist under the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/departments")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody());

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_COMPANY_NOT_FOUND");
    });

    it("returns 409 when the department code is already in use within the company", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue([
        buildDepartment({ departmentCode: "DPT-002" }),
      ]);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/departments")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody({ companyUuid: company.uuid, departmentCode: "DPT-002" }));

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_DUPLICATE_DEPARTMENT_CODE");
    });

    it("returns 201 with the created department", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      const department = buildDepartment({ departmentCode: "DPT-002" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue([]);
      (deps.repository.createDepartment as jest.Mock).mockResolvedValue(department);

      const res = await request(buildApp(deps))
        .post("/api/v1/organization/departments")
        .set("X-Tenant-Id", tenant.uuid)
        .send(validBody({ companyUuid: company.uuid }));

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(department.uuid);
      expect(res.body.data.departmentCode).toBe("DPT-002");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.companyId).toBeUndefined();
    });
  });

  describe("GET /api/v1/organization/departments/:departmentUuid", () => {
    it("returns 404 when the department does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/departments/${buildDepartment().uuid}`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_DEPARTMENT_NOT_FOUND");
    });

    it("returns 200 with the department", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const department = buildDepartment();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(department);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/departments/${department.uuid}`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(200);
      expect(res.body.data.departmentCode).toBe(department.departmentCode);
    });
  });

  describe("PUT /api/v1/organization/departments/:departmentUuid", () => {
    it("returns 404 when the department does not exist under the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/departments/${buildDepartment().uuid}`)
        .set("X-Tenant-Id", tenant.uuid)
        .send({ departmentName: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_DEPARTMENT_NOT_FOUND");
    });

    it("returns 200 with the updated department", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const department = buildDepartment();
      const updated = buildDepartment({ departmentName: "Renamed Department" });
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findDepartmentByUuid as jest.Mock).mockResolvedValue(department);
      (deps.repository.updateDepartment as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/organization/departments/${department.uuid}`)
        .set("X-Tenant-Id", tenant.uuid)
        .send({ departmentName: "Renamed Department" });

      expect(res.status).toBe(200);
      expect(res.body.data.departmentName).toBe("Renamed Department");
    });
  });

  describe("GET /api/v1/organization/companies/:companyUuid/departments", () => {
    it("returns 404 when the company does not exist under the tenant", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/companies/${buildCompany().uuid}/departments`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_COMPANY_NOT_FOUND");
    });

    it("returns 200 with every department scoped to the company", async () => {
      const deps = buildDeps();
      const tenant = buildTenant();
      const company = buildCompany();
      const departments = [buildDepartment({ uuid: "dpt-a" }), buildDepartment({ uuid: "dpt-b" })];
      (deps.repository.findTenantByUuid as jest.Mock).mockResolvedValue(tenant);
      (deps.repository.findCompanyByUuid as jest.Mock).mockResolvedValue(company);
      (deps.repository.listDepartmentsByCompany as jest.Mock).mockResolvedValue(departments);

      const res = await request(buildApp(deps))
        .get(`/api/v1/organization/companies/${company.uuid}/departments`)
        .set("X-Tenant-Id", tenant.uuid);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });
});
