// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// inventory.routes.spec.ts's own Product Category/Unit/Product/Warehouse/
// Stock tests exactly.
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
// not-found-looks-like-nonexistent assertion inventory.routes.spec.ts's own
// tests use (a real repository's `WHERE tenantId = ? AND uuid = ?` query
// makes a cross-tenant lookup and a genuinely nonexistent lookup return the
// identical 404, per MT-002).
//
// Soft-delete visibility rules: NOT APPLICABLE. Inventory Adjustment has no
// delete/remove endpoint, Business use case, or Repository method — there is
// nothing to test here without inventing an unimplemented feature.
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildInventoryAdjustment,
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

describe("Inventory Adjustment routes", () => {
  describe("POST /api/v1/inventory/adjustments", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/adjustments")
        .send({
          companyUuid: COMPANY_UUID,
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          adjustmentType: "INCREASE",
          quantity: "1.000000",
          reason: "Physical count variance",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/adjustments")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: "not-a-uuid",
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          adjustmentType: "INCREASE",
          quantity: "1.000000",
          reason: "Physical count variance",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when adjustmentType is not a recognized value", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/adjustments")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          adjustmentType: "SIDEWAYS",
          quantity: "1.000000",
          reason: "Physical count variance",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 201 with the created Inventory Adjustment, exposing only business fields", async () => {
      const deps = buildDeps();
      const created = buildInventoryAdjustment({
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
      });
      (deps.repository.createInventoryAdjustment as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/adjustments")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          adjustmentType: "INCREASE",
          quantity: "1.000000",
          reason: "Physical count variance",
          remarks: "Confirmed by warehouse supervisor",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({
        uuid: created.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
        adjustmentType: "INCREASE",
        quantity: created.quantity,
        reason: created.reason,
        remarks: created.remarks,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      });
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("GET /api/v1/inventory/adjustments", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(
        `/api/v1/inventory/adjustments?warehouseUuid=${WAREHOUSE_UUID}`,
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when warehouseUuid is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/adjustments")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Warehouse's Inventory Adjustments as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const adjustment = buildInventoryAdjustment({ warehouseUuid: WAREHOUSE_UUID });
      (deps.repository.listInventoryAdjustmentsByWarehouse as jest.Mock).mockResolvedValue([adjustment]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/adjustments?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(adjustment.uuid);
      expect(res.body.data[0].warehouseUuid).toBe(WAREHOUSE_UUID);
      expect(res.body.data[0].id).toBeUndefined();
      expect(res.body.data[0].tenantId).toBeUndefined();
    });

    it("does not merge results across two different Warehouses (warehouse isolation)", async () => {
      const deps = buildDeps();
      const otherWarehouseUuid = "00000000-0000-0000-0000-000000000201";
      const warehouseAAdjustments = [buildInventoryAdjustment({ warehouseUuid: WAREHOUSE_UUID })];
      const warehouseBAdjustments = [buildInventoryAdjustment({ warehouseUuid: otherWarehouseUuid })];
      (deps.repository.listInventoryAdjustmentsByWarehouse as jest.Mock).mockImplementation(
        async (_tenantId: bigint, warehouseUuid: string) =>
          warehouseUuid === WAREHOUSE_UUID ? warehouseAAdjustments : warehouseBAdjustments,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/inventory/adjustments?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/inventory/adjustments?warehouseUuid=${otherWarehouseUuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.body.data).toHaveLength(1);
      expect(resA.body.data[0].warehouseUuid).toBe(WAREHOUSE_UUID);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].warehouseUuid).toBe(otherWarehouseUuid);
      expect(deps.repository.listInventoryAdjustmentsByWarehouse).toHaveBeenNthCalledWith(1, 1n, WAREHOUSE_UUID);
      expect(deps.repository.listInventoryAdjustmentsByWarehouse).toHaveBeenNthCalledWith(2, 1n, otherWarehouseUuid);
    });
  });

  describe("GET /api/v1/inventory/adjustments/:adjustmentUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/adjustments/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 (INV_INVENTORY_ADJUSTMENT_NOT_FOUND) when the Inventory Adjustment does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/adjustments/${buildInventoryAdjustment().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_INVENTORY_ADJUSTMENT_NOT_FOUND");
    });

    it("returns 200 with the Inventory Adjustment, exposing only business fields", async () => {
      const deps = buildDeps();
      const adjustment = buildInventoryAdjustment({
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
      });
      (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(adjustment);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/adjustments/${adjustment.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: adjustment.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
        adjustmentType: adjustment.adjustmentType,
        quantity: adjustment.quantity,
        reason: adjustment.reason,
        remarks: adjustment.remarks,
        createdAt: adjustment.createdAt.toISOString(),
        updatedAt: adjustment.updatedAt.toISOString(),
      });
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("PUT /api/v1/inventory/adjustments/:adjustmentUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/adjustments/${buildInventoryAdjustment().uuid}`)
        .send({ reason: "Revised reason" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/adjustments/${buildInventoryAdjustment().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ reason: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 (INV_INVENTORY_ADJUSTMENT_NOT_FOUND) when the Inventory Adjustment does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/adjustments/${buildInventoryAdjustment().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ reason: "Damage during transit" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_INVENTORY_ADJUSTMENT_NOT_FOUND");
    });

    it("returns 200 with the updated Inventory Adjustment, exposing only business fields", async () => {
      const deps = buildDeps();
      const adjustment = buildInventoryAdjustment({
        uuid: "00000000-0000-0000-0000-000000000900",
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
      });
      const updated = buildInventoryAdjustment({
        uuid: adjustment.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
        reason: "Damage during transit",
        remarks: "Boxes crushed in transit",
      });
      (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(adjustment);
      (deps.repository.updateInventoryAdjustment as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/adjustments/${adjustment.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          quantity: "2.500000",
          reason: "Damage during transit",
          remarks: "Boxes crushed in transit",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: updated.uuid,
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
        adjustmentType: updated.adjustmentType,
        quantity: updated.quantity,
        reason: "Damage during transit",
        remarks: "Boxes crushed in transit",
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
      expect(deps.repository.updateInventoryAdjustment).toHaveBeenCalledWith(1n, adjustment.uuid, {
        adjustmentType: undefined,
        quantity: "2.500000",
        reason: "Damage during transit",
        remarks: "Boxes crushed in transit",
        updatedBy: null,
      });
    });
  });
});
