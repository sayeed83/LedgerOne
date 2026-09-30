// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// reorder-level.routes.spec.ts's own Product/Warehouse/Reorder Level tests
// exactly.
//
// This file's router is mounted bare (no `jwt-auth.middleware.ts` ahead of
// it), same as every other module's own `<module>.routes.spec.ts` — genuine
// 401 (missing/invalid JWT) coverage only exists at the real-app level
// (`test/integration/server.spec.ts`), which does not yet cover Sales at
// all, consistent with inventory.routes.spec.ts's own precedent.
// "Unauthorized" at this layer means the request never carries the
// `X-Tenant-Id` tenant-context header this module's endpoints require —
// asserted as 422 `VALIDATION_ERROR` below.
//
// "Forbidden tenant access" has no distinct test here: this module has no
// permission-gated action (no route calls `createPermissionMiddleware`,
// which remains globally unmounted) — there is no 403 case to exercise.
// Cross-tenant isolation is exercised instead via the identical
// not-found-looks-like-nonexistent assertion reorder-level.routes.spec.ts's
// own tests use (a real repository's `WHERE tenantId = ? AND uuid = ?`
// query makes a cross-tenant lookup and a genuinely nonexistent lookup
// return the identical 404, per MT-002).
//
// `GET /api/v1/customers` (tenant-wide) and
// `GET /api/v1/customers/by-company?companyUuid=` (Company-scoped) are two
// distinct, equally-authorized list variants (see
// list-customers.controller.ts's/list-customers-by-company.controller.ts's
// own header comments for why the second lives at its own static
// sub-path), so both get their own `describe` block below.
//
// Soft-delete visibility rules: NOT APPLICABLE. Customer has no
// delete/remove endpoint (CUS-003 forbids deletion while transaction
// history exists), Business use case, or Repository method — there is
// nothing to test here without inventing an unimplemented feature.
import express from "express";
import request from "supertest";
import { createSalesRouter } from "../../../src/shared/sales";
import { SalesDependencies } from "../../../src/shared/sales/business/sales.composition";
import { buildCustomer, createFakeSalesRepository } from "../../../src/shared/sales/business/test-support/fixtures";

function buildApp(deps: SalesDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/customers", createSalesRouter(deps));
  return app;
}

function buildDeps(): SalesDependencies {
  return { repository: createFakeSalesRepository() };
}

const TENANT_HEADER = "1";
const COMPANY_UUID = "00000000-0000-0000-0000-000000000100";
const OTHER_COMPANY_UUID = "00000000-0000-0000-0000-000000000101";

function expectHiddenFieldsUndefined(data: Record<string, unknown>) {
  expect(data.id).toBeUndefined();
  expect(data.tenantId).toBeUndefined();
  expect(data.createdBy).toBeUndefined();
  expect(data.updatedBy).toBeUndefined();
  expect(data.deletedAt).toBeUndefined();
}

function expectOnlyBusinessFields(data: Record<string, unknown>) {
  expect(Object.keys(data).sort()).toEqual(
    [
      "uuid",
      "companyUuid",
      "name",
      "addressLine1",
      "addressLine2",
      "city",
      "region",
      "postalCode",
      "countryCode",
      "creditLimit",
      "paymentTerms",
      "status",
      "createdAt",
      "updatedAt",
    ].sort(),
  );
  expectHiddenFieldsUndefined(data);
}

describe("Customer routes", () => {
  describe("POST /api/v1/customers", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/customers").send({
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createCustomer).not.toHaveBeenCalled();
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/customers")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: "not-a-uuid",
          name: "Regional Hardware Store",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createCustomer).not.toHaveBeenCalled();
    });

    it("returns 409 (SLS_CUSTOMER_ALREADY_EXISTS) when a Customer with the same name already exists in the Company (duplicate name)", async () => {
      const deps = buildDeps();
      (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(buildCustomer());

      const res = await request(buildApp(deps))
        .post("/api/v1/customers")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          name: "Regional Hardware Store",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("SLS_CUSTOMER_ALREADY_EXISTS");
      expect(deps.repository.createCustomer).not.toHaveBeenCalled();
    });

    it("returns 201 with the created Customer, exposing only business fields, and passes the exact expected payload to the repository", async () => {
      const deps = buildDeps();
      (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(null);
      const created = buildCustomer({
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
        addressLine1: "221B Baker Street",
        city: "London",
        countryCode: "GB",
        creditLimit: "50000.0000",
        paymentTerms: "Net-30",
      });
      (deps.repository.createCustomer as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/customers")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          name: "Regional Hardware Store",
          addressLine1: "221B Baker Street",
          city: "London",
          countryCode: "GB",
          creditLimit: "50000.0000",
          paymentTerms: "Net-30",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({
        uuid: created.uuid,
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
        addressLine1: "221B Baker Street",
        addressLine2: null,
        city: "London",
        region: null,
        postalCode: created.postalCode,
        countryCode: "GB",
        creditLimit: "50000.0000",
        paymentTerms: "Net-30",
        status: created.status,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      });
      expectOnlyBusinessFields(res.body.data);

      expect(deps.repository.findCustomerByName).toHaveBeenCalledWith(1n, COMPANY_UUID, "Regional Hardware Store");
      expect(deps.repository.createCustomer).toHaveBeenCalledWith(1n, {
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
        addressLine1: "221B Baker Street",
        addressLine2: null,
        city: "London",
        region: null,
        postalCode: null,
        countryCode: "GB",
        creditLimit: "50000.0000",
        paymentTerms: "Net-30",
        status: undefined,
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/customers", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/customers");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with every Customer for the tenant as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const customer = buildCustomer({ companyUuid: COMPANY_UUID });
      (deps.repository.listCustomers as jest.Mock).mockResolvedValue([customer]);

      const res = await request(buildApp(deps)).get("/api/v1/customers").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(customer.uuid);
      expectOnlyBusinessFields(res.body.data[0]);
      expect(deps.repository.listCustomers).toHaveBeenCalledWith(1n);
    });

    it("does not merge results across two different tenants (tenant isolation)", async () => {
      const deps = buildDeps();
      const tenant1Customers = [buildCustomer({ companyUuid: COMPANY_UUID })];
      const tenant2Customers = [buildCustomer({ companyUuid: OTHER_COMPANY_UUID })];
      (deps.repository.listCustomers as jest.Mock).mockImplementation(async (tenantId: bigint) =>
        tenantId === 1n ? tenant1Customers : tenant2Customers,
      );

      const res1 = await request(buildApp(deps)).get("/api/v1/customers").set("X-Tenant-Id", "1");
      const res2 = await request(buildApp(deps)).get("/api/v1/customers").set("X-Tenant-Id", "2");

      expect(res1.body.data).toHaveLength(1);
      expect(res1.body.data[0].companyUuid).toBe(COMPANY_UUID);
      expect(res2.body.data).toHaveLength(1);
      expect(res2.body.data[0].companyUuid).toBe(OTHER_COMPANY_UUID);
      expect(deps.repository.listCustomers).toHaveBeenNthCalledWith(1, 1n);
      expect(deps.repository.listCustomers).toHaveBeenNthCalledWith(2, 2n);
    });
  });

  describe("GET /api/v1/customers/by-company", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/customers/by-company?companyUuid=${COMPANY_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required companyUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/customers/by-company").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 for a malformed companyUuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/customers/by-company?companyUuid=not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Company's Customers as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const customer = buildCustomer({ companyUuid: COMPANY_UUID });
      (deps.repository.listCustomersByCompany as jest.Mock).mockResolvedValue([customer]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/customers/by-company?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(customer.uuid);
      expect(res.body.data[0].companyUuid).toBe(COMPANY_UUID);
      expectOnlyBusinessFields(res.body.data[0]);
    });

    it("passes ?companyUuid= through as the filter (verifies repository arguments)", async () => {
      const deps = buildDeps();
      (deps.repository.listCustomersByCompany as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/customers/by-company?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listCustomersByCompany).toHaveBeenCalledWith(1n, COMPANY_UUID);
    });

    it("does not merge results across two different Companies (company isolation)", async () => {
      const deps = buildDeps();
      const companyACustomers = [buildCustomer({ companyUuid: COMPANY_UUID })];
      const companyBCustomers = [buildCustomer({ companyUuid: OTHER_COMPANY_UUID })];
      (deps.repository.listCustomersByCompany as jest.Mock).mockImplementation(
        async (_tenantId: bigint, companyUuid: string) =>
          companyUuid === COMPANY_UUID ? companyACustomers : companyBCustomers,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/customers/by-company?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/customers/by-company?companyUuid=${OTHER_COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.body.data).toHaveLength(1);
      expect(resA.body.data[0].companyUuid).toBe(COMPANY_UUID);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].companyUuid).toBe(OTHER_COMPANY_UUID);
      expect(deps.repository.listCustomersByCompany).toHaveBeenNthCalledWith(1, 1n, COMPANY_UUID);
      expect(deps.repository.listCustomersByCompany).toHaveBeenNthCalledWith(2, 1n, OTHER_COMPANY_UUID);
    });
  });

  describe("GET /api/v1/customers/:customerUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/customers/not-a-uuid").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 (SLS_CUSTOMER_NOT_FOUND) when the Customer does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/customers/${buildCustomer().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("SLS_CUSTOMER_NOT_FOUND");
    });

    it("returns 200 with the Customer, exposing only business fields", async () => {
      const deps = buildDeps();
      const customer = buildCustomer({
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
        addressLine1: "221B Baker Street",
        city: "London",
        countryCode: "GB",
        creditLimit: "50000.0000",
        paymentTerms: "Net-30",
      });
      (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(customer);

      const res = await request(buildApp(deps))
        .get(`/api/v1/customers/${customer.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: customer.uuid,
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
        addressLine1: "221B Baker Street",
        addressLine2: null,
        city: "London",
        region: null,
        postalCode: customer.postalCode,
        countryCode: "GB",
        creditLimit: "50000.0000",
        paymentTerms: "Net-30",
        status: customer.status,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      });
      expectOnlyBusinessFields(res.body.data);
    });
  });

  describe("PUT /api/v1/customers/:customerUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/customers/${buildCustomer().uuid}`)
        .send({ name: "Metro Supplies" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateCustomer).not.toHaveBeenCalled();
    });

    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put("/api/v1/customers/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Metro Supplies" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateCustomer).not.toHaveBeenCalled();
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/customers/${buildCustomer().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateCustomer).not.toHaveBeenCalled();
    });

    it("returns 404 (SLS_CUSTOMER_NOT_FOUND) when the Customer does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/customers/${buildCustomer().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Metro Supplies" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("SLS_CUSTOMER_NOT_FOUND");
      expect(deps.repository.updateCustomer).not.toHaveBeenCalled();
    });

    it("returns 409 (SLS_CUSTOMER_ALREADY_EXISTS) when renaming to a name another Customer in the Company already uses", async () => {
      const deps = buildDeps();
      const customer = buildCustomer({
        uuid: "00000000-0000-0000-0000-000000000600",
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
      });
      const other = buildCustomer({ uuid: "00000000-0000-0000-0000-000000000602", name: "Metro Supplies" });
      (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(customer);
      (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(other);

      const res = await request(buildApp(deps))
        .put(`/api/v1/customers/${customer.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Metro Supplies" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("SLS_CUSTOMER_ALREADY_EXISTS");
      expect(deps.repository.updateCustomer).not.toHaveBeenCalled();
    });

    it("returns 200 with the updated Customer, exposing only business fields, and passes the exact expected arguments", async () => {
      const deps = buildDeps();
      const customer = buildCustomer({
        uuid: "00000000-0000-0000-0000-000000000600",
        companyUuid: COMPANY_UUID,
        name: "Regional Hardware Store",
      });
      const updated = buildCustomer({
        uuid: customer.uuid,
        companyUuid: COMPANY_UUID,
        name: "Metro Supplies",
      });
      (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(customer);
      (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(null);
      (deps.repository.updateCustomer as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/customers/${customer.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Metro Supplies" });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: updated.uuid,
        companyUuid: COMPANY_UUID,
        name: "Metro Supplies",
        addressLine1: updated.addressLine1,
        addressLine2: updated.addressLine2,
        city: updated.city,
        region: updated.region,
        postalCode: updated.postalCode,
        countryCode: updated.countryCode,
        creditLimit: updated.creditLimit,
        paymentTerms: updated.paymentTerms,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
      expectOnlyBusinessFields(res.body.data);

      expect(deps.repository.findCustomerByName).toHaveBeenCalledWith(1n, COMPANY_UUID, "Metro Supplies");
      // Only the fields UpdateCustomerProps supports reach the repository —
      // companyUuid is not an updatable field and is never sent, mirroring
      // update-reorder-level.routes.spec.ts's own exact-payload assertion.
      expect(deps.repository.updateCustomer).toHaveBeenCalledWith(1n, customer.uuid, {
        name: "Metro Supplies",
        addressLine1: undefined,
        addressLine2: undefined,
        city: undefined,
        region: undefined,
        postalCode: undefined,
        countryCode: undefined,
        creditLimit: undefined,
        paymentTerms: undefined,
        status: undefined,
        updatedBy: null,
      });
    });
  });
});
