// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// batch.routes.spec.ts's/stock.routes.spec.ts's own Product/Warehouse/Stock/
// Inventory Adjustment/Stock Movement/Batch tests exactly.
//
// This file's router is mounted bare (no `jwt-auth.middleware.ts` ahead of
// it), same as every other module's own `<module>.routes.spec.ts` — genuine
// 401 (missing/invalid JWT) coverage only exists at the real-app level
// (`test/integration/server.spec.ts`), which does not yet cover Inventory at
// all, consistent with inventory.routes.spec.ts's own precedent.
// "Unauthorized" at this layer means the request never carries the
// `X-Tenant-Id` tenant-context header this module's endpoints require —
// asserted as 422 `VALIDATION_ERROR` below.
//
// "Forbidden tenant access" has no distinct test here: this module has no
// permission-gated action (no route calls `createPermissionMiddleware`,
// which remains globally unmounted) — there is no 403 case to exercise.
// Cross-tenant isolation is exercised instead via the identical
// not-found-looks-like-nonexistent assertion batch.routes.spec.ts's own
// tests use (a real repository's `WHERE tenantId = ? AND uuid = ?` query
// makes a cross-tenant lookup and a genuinely nonexistent lookup return the
// identical 404, per MT-002).
//
// `GET /api/v1/inventory/reorder-levels?companyUuid=` and
// `GET /api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=` are two
// distinct, equally-authorized list variants (see
// list-reorder-levels-by-company.controller.ts's/
// list-reorder-levels-by-warehouse.controller.ts's own header comments for
// why the second lives at its own static sub-path), so both get their own
// `describe` block below.
//
// Soft-delete visibility rules: NOT APPLICABLE. Reorder Level has no
// delete/remove endpoint, Business use case, or Repository method — there is
// nothing to test here without inventing an unimplemented feature.
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildReorderLevel,
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
const OTHER_COMPANY_UUID = "00000000-0000-0000-0000-000000000101";
const WAREHOUSE_UUID = "00000000-0000-0000-0000-000000000200";
const OTHER_WAREHOUSE_UUID = "00000000-0000-0000-0000-000000000201";

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
      "warehouseUuid",
      "productId",
      "reorderLevel",
      "reorderQuantity",
      "createdAt",
      "updatedAt",
    ].sort(),
  );
  expectHiddenFieldsUndefined(data);
}

describe("Reorder Level routes", () => {
  describe("POST /api/v1/inventory/reorder-levels", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/inventory/reorder-levels").send({
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
        reorderLevel: "100.000000",
        reorderQuantity: "500.000000",
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/reorder-levels")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: "not-a-uuid",
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          reorderLevel: "100.000000",
          reorderQuantity: "500.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_INVALID_REORDER_LEVEL_QUANTITY) when reorderLevel is negative", async () => {
      const deps = buildDeps();
      (deps.repository.findReorderLevelByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/reorder-levels")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          reorderLevel: "-1",
          reorderQuantity: "500.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_INVALID_REORDER_LEVEL_QUANTITY");
      expect(deps.repository.createReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 409 (INV_REORDER_LEVEL_ALREADY_EXISTS) when a Reorder Level already exists for the Warehouse/Product pair (duplicate-pair)", async () => {
      const deps = buildDeps();
      (deps.repository.findReorderLevelByWarehouseAndProduct as jest.Mock).mockResolvedValue(buildReorderLevel());

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/reorder-levels")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          reorderLevel: "100.000000",
          reorderQuantity: "500.000000",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_REORDER_LEVEL_ALREADY_EXISTS");
      expect(deps.repository.createReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 201 with the created Reorder Level, exposing only business fields, and passes the exact expected payload to the repository", async () => {
      const deps = buildDeps();
      (deps.repository.findReorderLevelByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
      const created = buildReorderLevel({
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
        reorderLevel: "100.000000",
        reorderQuantity: "500.000000",
      });
      (deps.repository.createReorderLevel as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/reorder-levels")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          reorderLevel: "100.000000",
          reorderQuantity: "500.000000",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({
        uuid: created.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
        reorderLevel: "100.000000",
        reorderQuantity: "500.000000",
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      });
      expectOnlyBusinessFields(res.body.data);

      expect(deps.repository.findReorderLevelByWarehouseAndProduct).toHaveBeenCalledWith(1n, WAREHOUSE_UUID, 1n);
      expect(deps.repository.createReorderLevel).toHaveBeenCalledWith(1n, {
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
        reorderLevel: "100.000000",
        reorderQuantity: "500.000000",
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/inventory/reorder-levels", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/inventory/reorder-levels?companyUuid=${COMPANY_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required companyUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/reorder-levels")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 for a malformed companyUuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/reorder-levels?companyUuid=not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Company's Reorder Levels as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const reorderLevel = buildReorderLevel({ companyUuid: COMPANY_UUID });
      (deps.repository.listReorderLevelsByCompany as jest.Mock).mockResolvedValue([reorderLevel]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(reorderLevel.uuid);
      expect(res.body.data[0].companyUuid).toBe(COMPANY_UUID);
      expectOnlyBusinessFields(res.body.data[0]);
    });

    it("passes ?companyUuid= through as the filter (verifies companyUuid filtering)", async () => {
      const deps = buildDeps();
      (deps.repository.listReorderLevelsByCompany as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listReorderLevelsByCompany).toHaveBeenCalledWith(1n, COMPANY_UUID);
    });

    it("does not merge results across two different Companies (company isolation)", async () => {
      const deps = buildDeps();
      const companyAReorderLevels = [buildReorderLevel({ companyUuid: COMPANY_UUID })];
      const companyBReorderLevels = [buildReorderLevel({ companyUuid: OTHER_COMPANY_UUID })];
      (deps.repository.listReorderLevelsByCompany as jest.Mock).mockImplementation(
        async (_tenantId: bigint, companyUuid: string) =>
          companyUuid === COMPANY_UUID ? companyAReorderLevels : companyBReorderLevels,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels?companyUuid=${OTHER_COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.body.data).toHaveLength(1);
      expect(resA.body.data[0].companyUuid).toBe(COMPANY_UUID);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].companyUuid).toBe(OTHER_COMPANY_UUID);
      expect(deps.repository.listReorderLevelsByCompany).toHaveBeenNthCalledWith(1, 1n, COMPANY_UUID);
      expect(deps.repository.listReorderLevelsByCompany).toHaveBeenNthCalledWith(2, 1n, OTHER_COMPANY_UUID);
    });
  });

  describe("GET /api/v1/inventory/reorder-levels/by-warehouse", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(
        `/api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=${WAREHOUSE_UUID}`,
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required warehouseUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/reorder-levels/by-warehouse")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 for a malformed warehouseUuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Warehouse's Reorder Levels as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const reorderLevel = buildReorderLevel({ warehouseUuid: WAREHOUSE_UUID });
      (deps.repository.listReorderLevelsByWarehouse as jest.Mock).mockResolvedValue([reorderLevel]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(reorderLevel.uuid);
      expect(res.body.data[0].warehouseUuid).toBe(WAREHOUSE_UUID);
      expectOnlyBusinessFields(res.body.data[0]);
    });

    it("passes ?warehouseUuid= through as the filter (verifies warehouseUuid filtering)", async () => {
      const deps = buildDeps();
      (deps.repository.listReorderLevelsByWarehouse as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listReorderLevelsByWarehouse).toHaveBeenCalledWith(1n, WAREHOUSE_UUID);
    });

    it("does not merge results across two different Warehouses (warehouse isolation)", async () => {
      const deps = buildDeps();
      const warehouseAReorderLevels = [buildReorderLevel({ warehouseUuid: WAREHOUSE_UUID })];
      const warehouseBReorderLevels = [buildReorderLevel({ warehouseUuid: OTHER_WAREHOUSE_UUID })];
      (deps.repository.listReorderLevelsByWarehouse as jest.Mock).mockImplementation(
        async (_tenantId: bigint, warehouseUuid: string) =>
          warehouseUuid === WAREHOUSE_UUID ? warehouseAReorderLevels : warehouseBReorderLevels,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=${OTHER_WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.body.data).toHaveLength(1);
      expect(resA.body.data[0].warehouseUuid).toBe(WAREHOUSE_UUID);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].warehouseUuid).toBe(OTHER_WAREHOUSE_UUID);
      expect(deps.repository.listReorderLevelsByWarehouse).toHaveBeenNthCalledWith(1, 1n, WAREHOUSE_UUID);
      expect(deps.repository.listReorderLevelsByWarehouse).toHaveBeenNthCalledWith(2, 1n, OTHER_WAREHOUSE_UUID);
    });
  });

  describe("GET /api/v1/inventory/reorder-levels/:reorderLevelUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/reorder-levels/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 (INV_REORDER_LEVEL_NOT_FOUND) when the Reorder Level does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels/${buildReorderLevel().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_REORDER_LEVEL_NOT_FOUND");
    });

    it("returns 200 with the Reorder Level, exposing only business fields", async () => {
      const deps = buildDeps();
      const reorderLevel = buildReorderLevel({
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
      });
      (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(reorderLevel);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/reorder-levels/${reorderLevel.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: reorderLevel.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
        reorderLevel: reorderLevel.reorderLevel,
        reorderQuantity: reorderLevel.reorderQuantity,
        createdAt: reorderLevel.createdAt.toISOString(),
        updatedAt: reorderLevel.updatedAt.toISOString(),
      });
      expectOnlyBusinessFields(res.body.data);
    });
  });

  describe("PUT /api/v1/inventory/reorder-levels/:reorderLevelUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/reorder-levels/${buildReorderLevel().uuid}`)
        .send({ reorderLevel: "200.000000" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/reorder-levels/${buildReorderLevel().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ reorderLevel: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put("/api/v1/inventory/reorder-levels/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ reorderLevel: "200.000000" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 404 (INV_REORDER_LEVEL_NOT_FOUND) when the Reorder Level does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/reorder-levels/${buildReorderLevel().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ reorderLevel: "200.000000" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_REORDER_LEVEL_NOT_FOUND");
      expect(deps.repository.updateReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_INVALID_REORDER_LEVEL_QUANTITY) when the supplied reorderLevel is negative", async () => {
      const deps = buildDeps();
      const reorderLevel = buildReorderLevel({ uuid: "00000000-0000-0000-0000-000000000900" });
      (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(reorderLevel);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/reorder-levels/${reorderLevel.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ reorderLevel: "-5" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_INVALID_REORDER_LEVEL_QUANTITY");
      expect(deps.repository.updateReorderLevel).not.toHaveBeenCalled();
    });

    it("returns 200 with the updated Reorder Level, exposing only business fields, and passes the exact expected arguments", async () => {
      const deps = buildDeps();
      const reorderLevel = buildReorderLevel({
        uuid: "00000000-0000-0000-0000-000000000900",
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
        reorderLevel: "100.000000",
      });
      const updated = buildReorderLevel({
        uuid: reorderLevel.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
        reorderLevel: "200.000000",
      });
      (deps.repository.findReorderLevelByUuid as jest.Mock).mockResolvedValue(reorderLevel);
      (deps.repository.updateReorderLevel as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/reorder-levels/${reorderLevel.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ reorderLevel: "200.000000" });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: updated.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
        reorderLevel: "200.000000",
        reorderQuantity: updated.reorderQuantity,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
      expectOnlyBusinessFields(res.body.data);

      // Only the fields UpdateReorderLevelProps supports reach the repository
      // — companyUuid/warehouseUuid/productId are not updatable and are never
      // sent, mirroring update-batch.routes.spec.ts's own exact-payload
      // assertion.
      expect(deps.repository.updateReorderLevel).toHaveBeenCalledWith(1n, reorderLevel.uuid, {
        reorderLevel: "200.000000",
        reorderQuantity: undefined,
        updatedBy: null,
      });
    });
  });
});
