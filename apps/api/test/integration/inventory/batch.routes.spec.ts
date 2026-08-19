// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// inventory-adjustment.routes.spec.ts's/stock-movement.routes.spec.ts's own
// Product Category/Unit/Product/Warehouse/Stock/Inventory Adjustment/Stock
// Movement tests exactly.
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
// not-found-looks-like-nonexistent assertion inventory-adjustment.routes.spec.ts's
// own tests use (a real repository's `WHERE tenantId = ? AND uuid = ?` query
// makes a cross-tenant lookup and a genuinely nonexistent lookup return the
// identical 404, per MT-002).
//
// `GET /api/v1/inventory/batches` (the module's one bare list route) is
// filled by `listBatchesByWarehouseController` only — mirroring Inventory
// Adjustment's/Stock Movement's own precedent — so its own tests exercise
// `warehouseUuid`, not `productId`. `list-batches-by-product.controller.ts`
// is not mounted to any route this milestone (see its own header comment),
// so there is nothing to exercise there.
//
// Soft-delete visibility rules: NOT APPLICABLE. Batch has no delete/remove
// endpoint, Business use case, or Repository method — there is nothing to
// test here without inventing an unimplemented feature.
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildBatch,
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
const WAREHOUSE_UUID = "00000000-0000-0000-0000-000000000200";

describe("Batch routes", () => {
  describe("POST /api/v1/inventory/batches", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/batches")
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          warehouseUuid: WAREHOUSE_UUID,
          batchNumber: "B2027-03",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createBatch).not.toHaveBeenCalled();
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/batches")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: "not-a-uuid",
          productId: "1",
          warehouseUuid: WAREHOUSE_UUID,
          batchNumber: "B2027-03",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createBatch).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_INVALID_BATCH_DATE_RANGE) when manufactureDate is after expiryDate", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/batches")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          warehouseUuid: WAREHOUSE_UUID,
          batchNumber: "B2027-03",
          manufactureDate: "2027-12-01T00:00:00.000Z",
          expiryDate: "2027-01-01T00:00:00.000Z",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_INVALID_BATCH_DATE_RANGE");
      expect(deps.repository.createBatch).not.toHaveBeenCalled();
    });

    it("returns 201 with the created Batch, exposing only business fields", async () => {
      const deps = buildDeps();
      const created = buildBatch({
        companyUuid: COMPANY_UUID,
        productId: 1n,
        warehouseUuid: WAREHOUSE_UUID,
        batchNumber: "B2027-03",
        manufactureDate: new Date("2027-01-01T00:00:00.000Z"),
        expiryDate: new Date("2027-12-01T00:00:00.000Z"),
        quantity: "1000.000000",
      });
      (deps.repository.createBatch as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/batches")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          warehouseUuid: WAREHOUSE_UUID,
          batchNumber: "B2027-03",
          manufactureDate: "2027-01-01T00:00:00.000Z",
          expiryDate: "2027-12-01T00:00:00.000Z",
          quantity: "1000.000000",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({
        uuid: created.uuid,
        companyUuid: COMPANY_UUID,
        productId: "1",
        warehouseUuid: WAREHOUSE_UUID,
        batchNumber: "B2027-03",
        manufactureDate: created.manufactureDate.toISOString(),
        expiryDate: created.expiryDate.toISOString(),
        quantity: created.quantity,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      });
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();

      expect(deps.repository.createBatch).toHaveBeenCalledWith(1n, {
        companyUuid: COMPANY_UUID,
        productId: 1n,
        warehouseUuid: WAREHOUSE_UUID,
        batchNumber: "B2027-03",
        manufactureDate: new Date("2027-01-01T00:00:00.000Z"),
        expiryDate: new Date("2027-12-01T00:00:00.000Z"),
        quantity: "1000.000000",
        status: undefined,
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/inventory/batches", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/inventory/batches?warehouseUuid=${WAREHOUSE_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when warehouseUuid is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/inventory/batches").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Warehouse's Batches as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const batch = buildBatch({ warehouseUuid: WAREHOUSE_UUID });
      (deps.repository.listBatchesByWarehouse as jest.Mock).mockResolvedValue([batch]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/batches?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(batch.uuid);
      expect(res.body.data[0].warehouseUuid).toBe(WAREHOUSE_UUID);
      expect(res.body.data[0].id).toBeUndefined();
      expect(res.body.data[0].tenantId).toBeUndefined();
      expect(res.body.data[0].createdBy).toBeUndefined();
      expect(res.body.data[0].updatedBy).toBeUndefined();
      expect(res.body.data[0].deletedAt).toBeUndefined();
    });

    it("does not merge results across two different Warehouses (warehouse isolation)", async () => {
      const deps = buildDeps();
      const otherWarehouseUuid = "00000000-0000-0000-0000-000000000201";
      const warehouseABatches = [buildBatch({ warehouseUuid: WAREHOUSE_UUID })];
      const warehouseBBatches = [buildBatch({ warehouseUuid: otherWarehouseUuid })];
      (deps.repository.listBatchesByWarehouse as jest.Mock).mockImplementation(
        async (_tenantId: bigint, warehouseUuid: string) =>
          warehouseUuid === WAREHOUSE_UUID ? warehouseABatches : warehouseBBatches,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/inventory/batches?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/inventory/batches?warehouseUuid=${otherWarehouseUuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.body.data).toHaveLength(1);
      expect(resA.body.data[0].warehouseUuid).toBe(WAREHOUSE_UUID);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].warehouseUuid).toBe(otherWarehouseUuid);
      expect(deps.repository.listBatchesByWarehouse).toHaveBeenNthCalledWith(1, 1n, WAREHOUSE_UUID);
      expect(deps.repository.listBatchesByWarehouse).toHaveBeenNthCalledWith(2, 1n, otherWarehouseUuid);
    });
  });

  describe("GET /api/v1/inventory/batches/:batchUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/batches/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 (INV_BATCH_NOT_FOUND) when the Batch does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/batches/${buildBatch().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_BATCH_NOT_FOUND");
    });

    it("returns 200 with the Batch, exposing only business fields", async () => {
      const deps = buildDeps();
      const batch = buildBatch({
        companyUuid: COMPANY_UUID,
        productId: 1n,
        warehouseUuid: WAREHOUSE_UUID,
      });
      (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/batches/${batch.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: batch.uuid,
        companyUuid: COMPANY_UUID,
        productId: "1",
        warehouseUuid: WAREHOUSE_UUID,
        batchNumber: batch.batchNumber,
        manufactureDate: batch.manufactureDate ? batch.manufactureDate.toISOString() : null,
        expiryDate: batch.expiryDate,
        quantity: batch.quantity,
        status: batch.status,
        createdAt: batch.createdAt.toISOString(),
        updatedAt: batch.updatedAt.toISOString(),
      });
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("PUT /api/v1/inventory/batches/:batchUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/batches/${buildBatch().uuid}`)
        .send({ batchNumber: "B2027-06" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateBatch).not.toHaveBeenCalled();
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/batches/${buildBatch().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ batchNumber: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.updateBatch).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_INVALID_BATCH_DATE_RANGE) when the supplied manufactureDate is after the existing expiryDate", async () => {
      const deps = buildDeps();
      const batch = buildBatch({
        uuid: "00000000-0000-0000-0000-000000000900",
        expiryDate: new Date("2027-06-01T00:00:00.000Z"),
      });
      (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/batches/${batch.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ manufactureDate: "2027-12-01T00:00:00.000Z" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_INVALID_BATCH_DATE_RANGE");
      expect(deps.repository.updateBatch).not.toHaveBeenCalled();
    });

    it("returns 404 (INV_BATCH_NOT_FOUND) when the Batch does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/batches/${buildBatch().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ batchNumber: "B2027-06" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_BATCH_NOT_FOUND");
    });

    it("returns 200 with the updated Batch, exposing only business fields and sending only editable fields to the repository", async () => {
      const deps = buildDeps();
      const batch = buildBatch({
        uuid: "00000000-0000-0000-0000-000000000900",
        companyUuid: COMPANY_UUID,
        productId: 1n,
        warehouseUuid: WAREHOUSE_UUID,
      });
      const updated = buildBatch({
        uuid: batch.uuid,
        companyUuid: COMPANY_UUID,
        productId: 1n,
        warehouseUuid: WAREHOUSE_UUID,
        batchNumber: "B2027-06",
        quantity: "500.000000",
      });
      (deps.repository.findBatchByUuid as jest.Mock).mockResolvedValue(batch);
      (deps.repository.updateBatch as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/batches/${batch.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          batchNumber: "B2027-06",
          quantity: "500.000000",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: updated.uuid,
        companyUuid: COMPANY_UUID,
        productId: "1",
        warehouseUuid: WAREHOUSE_UUID,
        batchNumber: "B2027-06",
        manufactureDate: updated.manufactureDate ? updated.manufactureDate.toISOString() : null,
        expiryDate: updated.expiryDate,
        quantity: "500.000000",
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();

      // Only the fields UpdateBatchProps supports reach the repository —
      // companyUuid/productId/warehouseUuid are not updatable and are never
      // sent, mirroring update-inventory-adjustment.routes.spec.ts's own
      // exact-payload assertion.
      expect(deps.repository.updateBatch).toHaveBeenCalledWith(1n, batch.uuid, {
        batchNumber: "B2027-06",
        manufactureDate: undefined,
        expiryDate: undefined,
        quantity: "500.000000",
        status: undefined,
        updatedBy: null,
      });
    });
  });
});
