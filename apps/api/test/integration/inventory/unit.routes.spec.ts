// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Accounting's, Organization's, and this module's own Product Category
// integration test (`inventory.routes.spec.ts`) exactly.
//
// This file's router is mounted bare (no `jwt-auth.middleware.ts` ahead of
// it), same as Product Category's own file — genuine 401 (missing/invalid
// JWT) coverage only exists at the real-app level
// (`test/integration/server.spec.ts`), which doesn't cover Inventory at
// all yet, consistent with that existing precedent. "Unauthorized" at this
// layer means the request never carries the `X-Tenant-Id` tenant-context
// header this module's endpoints require — asserted as 422
// `VALIDATION_ERROR` below.
//
// "Forbidden tenant access" has no distinct test here, same reasoning as
// Product Category's own file: this module has no permission-gated route.
// Cross-tenant isolation is exercised via the same not-found assertions
// (a real tenant-scoped repository query makes a cross-tenant lookup and a
// genuinely nonexistent lookup identical, both 404, per MT-002).
//
// Soft-delete visibility rules: NOT APPLICABLE — Unit has no delete/remove
// endpoint, Business use case, or Repository method (Ch.36 defines no
// removal behavior).
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildUnit,
  createFakeInventoryRepository,
  createFakeTransactionRunner,
} from "../../../src/shared/inventory/business/test-support/fixtures";

function buildApp(deps: InventoryDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/inventory", createInventoryRouter(deps));
  return app;
}

function buildDeps(): InventoryDependencies {
  return { repository: createFakeInventoryRepository(), transactionRunner: createFakeTransactionRunner() };
}

const TENANT_HEADER = "1";
const COMPANY_UUID = "00000000-0000-0000-0000-000000000100";

describe("Inventory routes — Unit", () => {
  describe("POST /api/v1/inventory/units", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/units")
        .send({ companyUuid: COMPANY_UUID, name: "Pieces", symbol: "Pcs" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/units")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the supplied base Unit does not exist (base-unit-not-found)", async () => {
      const deps = buildDeps();
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/units")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          name: "Box of 100",
          symbol: "Box",
          baseUnitUuid: "00000000-0000-0000-0000-000000000601",
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_UNIT_NOT_FOUND");
      expect(deps.repository.createUnit).not.toHaveBeenCalled();
    });

    it("returns 422 when conversionFactor is not a positive number (invalid conversion factor)", async () => {
      const deps = buildDeps();
      const baseUnit = buildUnit({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(baseUnit);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/units")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          name: "Box of 100",
          symbol: "Box",
          baseUnitUuid: baseUnit.uuid,
          conversionFactor: "0",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_INVALID_UNIT_CONVERSION_FACTOR_VALUE");
      expect(deps.repository.createUnit).not.toHaveBeenCalled();
    });

    it("returns 201 with the created Unit, exposing only business fields (never id/tenantId/baseUnitId/createdBy/updatedBy/deletedAt)", async () => {
      const deps = buildDeps();
      const created = buildUnit({ companyUuid: COMPANY_UUID, name: "Pieces", symbol: "Pcs" });
      (deps.repository.createUnit as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/units")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: COMPANY_UUID, name: "Pieces", symbol: "Pcs" });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.companyUuid).toBe(COMPANY_UUID);
      expect(res.body.data.name).toBe("Pieces");
      expect(res.body.data.symbol).toBe("Pcs");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.baseUnitId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });

    it("creates an alternate Unit with a resolved base Unit and a positive conversionFactor", async () => {
      const deps = buildDeps();
      const baseUnit = buildUnit({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(baseUnit);
      (deps.repository.createUnit as jest.Mock).mockResolvedValue(
        buildUnit({ name: "Box of 100", symbol: "Box", conversionFactor: "100" }),
      );

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/units")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          name: "Box of 100",
          symbol: "Box",
          baseUnitUuid: baseUnit.uuid,
          conversionFactor: "100",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.conversionFactor).toBe("100");
      expect(deps.repository.createUnit).toHaveBeenCalledWith(1n, {
        companyUuid: COMPANY_UUID,
        name: "Box of 100",
        symbol: "Box",
        baseUnitId: 2n,
        conversionFactor: "100",
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/inventory/units", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/inventory/units?companyUuid=${COMPANY_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required companyUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/inventory/units").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Company's Units as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const units = [buildUnit()];
      (deps.repository.listUnitsByCompany as jest.Mock).mockResolvedValue(units);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/units?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(units[0].uuid);
      expect(res.body.data[0].id).toBeUndefined();
      expect(res.body.data[0].tenantId).toBeUndefined();
      expect(res.body.data[0].createdBy).toBeUndefined();
      expect(res.body.data[0].updatedBy).toBeUndefined();
      expect(res.body.data[0].deletedAt).toBeUndefined();
    });

    it("passes ?companyUuid= through as the filter (verifies companyUuid filtering)", async () => {
      const deps = buildDeps();
      (deps.repository.listUnitsByCompany as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/units?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listUnitsByCompany).toHaveBeenCalledWith(1n, COMPANY_UUID);
    });
  });

  describe("GET /api/v1/inventory/units/base-units", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/inventory/units/base-units?companyUuid=${COMPANY_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required companyUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/units/base-units")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with only the Company's base Units as an array (verifies companyUuid filtering)", async () => {
      const deps = buildDeps();
      const baseUnits = [buildUnit({ baseUnitId: null })];
      (deps.repository.listBaseUnits as jest.Mock).mockResolvedValue(baseUnits);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/units/base-units?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(baseUnits[0].uuid);
      expect(deps.repository.listBaseUnits).toHaveBeenCalledWith(1n, COMPANY_UUID);
      expect(deps.repository.listUnitsByCompany).not.toHaveBeenCalled();
    });

    it("this static route is reachable and distinct from the :unitUuid param route", async () => {
      const deps = buildDeps();
      (deps.repository.listBaseUnits as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/units/base-units?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      // A misrouted request would instead hit getUnitController, fail uuid
      // validation on the literal string "base-units", and return
      // VALIDATION_ERROR instead of reaching listBaseUnitsController.
      expect(res.status).toBe(200);
      expect(res.body.error).toBeUndefined();
      expect(deps.repository.findUnitByUuid).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/inventory/units/:unitUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/units/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Unit does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/units/${buildUnit().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_UNIT_NOT_FOUND");
    });

    it("returns 200 with the Unit, exposing only business fields", async () => {
      const deps = buildDeps();
      const unit = buildUnit();
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/units/${unit.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(unit.uuid);
      expect(res.body.data.companyUuid).toBe(unit.companyUuid);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.baseUnitId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("PUT /api/v1/inventory/units/:unitUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/units/${buildUnit().uuid}`)
        .send({ name: "Revised" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/units/${buildUnit().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Unit does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/units/${buildUnit().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Revised" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_UNIT_NOT_FOUND");
    });

    it("returns 404 when the new base Unit does not exist (base-unit-not-found)", async () => {
      const deps = buildDeps();
      const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
      (deps.repository.findUnitByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) =>
        uuid === unit.uuid ? unit : null,
      );

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/units/${unit.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ baseUnitUuid: "00000000-0000-0000-0000-000000000601" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_UNIT_NOT_FOUND");
      expect(deps.repository.updateUnit).not.toHaveBeenCalled();
    });

    it("returns 422 when the revised conversionFactor is not a positive number (invalid conversion factor)", async () => {
      const deps = buildDeps();
      const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/units/${unit.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ conversionFactor: "-1" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_INVALID_UNIT_CONVERSION_FACTOR_VALUE");
      expect(deps.repository.updateUnit).not.toHaveBeenCalled();
    });

    it("returns 200 with the updated Unit", async () => {
      const deps = buildDeps();
      const unit = buildUnit({ name: "Pieces" });
      const updated = buildUnit({ name: "Pieces (Revised)" });
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
      (deps.repository.updateUnit as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/units/${unit.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Pieces (Revised)" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Pieces (Revised)");
    });

    it("clears the base Unit when baseUnitUuid is explicitly null", async () => {
      const deps = buildDeps();
      const unit = buildUnit();
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
      (deps.repository.updateUnit as jest.Mock).mockResolvedValue(unit);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/units/${unit.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ baseUnitUuid: null });

      expect(res.status).toBe(200);
      expect(deps.repository.updateUnit).toHaveBeenCalledWith(1n, unit.uuid, {
        name: undefined,
        symbol: undefined,
        baseUnitId: null,
        conversionFactor: undefined,
        updatedBy: null,
      });
    });
  });
});
