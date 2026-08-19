// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// inventory-adjustment.routes.spec.ts's/inventory.routes.spec.ts's own
// Product Category/Unit/Product/Warehouse/Stock/Inventory Adjustment tests
// exactly.
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
//
// Update/Remove: NOT APPLICABLE. Stock Movement is immutable once recorded
// (00_BUSINESS_RULES.md Ch.39.5/STM-002) — there is no PUT/DELETE route at
// all (confirmed structurally by the router itself), so there is nothing to
// test here without inventing an unimplemented feature.
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildStock,
  buildStockMovement,
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
const OTHER_WAREHOUSE_UUID = "00000000-0000-0000-0000-000000000201";
const REFERENCE_UUID = "00000000-0000-0000-0000-000000000300";

describe("Stock Movement routes", () => {
  describe("POST /api/v1/inventory/stock-movements", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stock-movements")
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          destinationWarehouseUuid: WAREHOUSE_UUID,
          movementType: "RECEIPT",
          quantity: "10.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stock-movements")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: "not-a-uuid",
          productId: "1",
          destinationWarehouseUuid: WAREHOUSE_UUID,
          movementType: "RECEIPT",
          quantity: "10.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_STOCK_MOVEMENT_INVALID_WAREHOUSE) for a RECEIPT with no destinationWarehouseUuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stock-movements")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          movementType: "RECEIPT",
          quantity: "10.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_STOCK_MOVEMENT_INVALID_WAREHOUSE");
      expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_STOCK_MOVEMENT_INVALID_WAREHOUSE) for an ISSUE with no sourceWarehouseUuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stock-movements")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          movementType: "ISSUE",
          quantity: "5.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_STOCK_MOVEMENT_INVALID_WAREHOUSE");
      expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_STOCK_MOVEMENT_INVALID_WAREHOUSE) for a TRANSFER missing the destination Warehouse (STM-003)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stock-movements")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          sourceWarehouseUuid: WAREHOUSE_UUID,
          movementType: "TRANSFER",
          quantity: "5.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_STOCK_MOVEMENT_INVALID_WAREHOUSE");
      expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
    });

    it("returns 422 (INV_STOCK_MOVEMENT_INVALID_WAREHOUSE) for a TRANSFER missing the source Warehouse (STM-003)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stock-movements")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          destinationWarehouseUuid: OTHER_WAREHOUSE_UUID,
          movementType: "TRANSFER",
          quantity: "5.000000",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INV_STOCK_MOVEMENT_INVALID_WAREHOUSE");
      expect(deps.repository.createStockMovement).not.toHaveBeenCalled();
    });

    it("returns 201 with the created Stock Movement, exposing only business fields, and calls the repository with the exact payload", async () => {
      const deps = buildDeps();
      const created = buildStockMovement({
        companyUuid: COMPANY_UUID,
        productId: 1n,
        sourceWarehouseUuid: null,
        destinationWarehouseUuid: WAREHOUSE_UUID,
        referenceType: "GOODS_RECEIPT",
        referenceUuid: REFERENCE_UUID,
      });
      (deps.repository.createStockMovement as jest.Mock).mockResolvedValue(created);
      (deps.repository.applyStockQuantityDelta as jest.Mock).mockResolvedValue(buildStock());

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stock-movements")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productId: "1",
          destinationWarehouseUuid: WAREHOUSE_UUID,
          movementType: "RECEIPT",
          quantity: "10.000000",
          referenceType: "GOODS_RECEIPT",
          referenceUuid: REFERENCE_UUID,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({
        uuid: created.uuid,
        companyUuid: COMPANY_UUID,
        productId: "1",
        sourceWarehouseUuid: null,
        destinationWarehouseUuid: WAREHOUSE_UUID,
        movementType: "RECEIPT",
        quantity: created.quantity,
        referenceType: "GOODS_RECEIPT",
        referenceUuid: REFERENCE_UUID,
        createdAt: created.createdAt.toISOString(),
      });
      expect(Object.keys(res.body.data).sort()).toEqual(
        [
          "uuid",
          "companyUuid",
          "productId",
          "sourceWarehouseUuid",
          "destinationWarehouseUuid",
          "movementType",
          "quantity",
          "referenceType",
          "referenceUuid",
          "createdAt",
        ].sort(),
      );
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
      expect(res.body.data.updatedAt).toBeUndefined();

      expect(deps.repository.createStockMovement).toHaveBeenCalledWith(
        1n,
        {
          companyUuid: COMPANY_UUID,
          productId: 1n,
          sourceWarehouseUuid: null,
          destinationWarehouseUuid: WAREHOUSE_UUID,
          movementType: "RECEIPT",
          quantity: "10.000000",
          referenceType: "GOODS_RECEIPT",
          referenceUuid: REFERENCE_UUID,
          createdBy: null,
        },
        "fake-tx",
      );

      // STM-001/Ch.38.5 — the destination Warehouse's Stock is increased by
      // the movement quantity, inside the same transaction.
      expect(deps.repository.applyStockQuantityDelta).toHaveBeenCalledTimes(1);
      expect(deps.repository.applyStockQuantityDelta).toHaveBeenCalledWith(
        1n,
        COMPANY_UUID,
        WAREHOUSE_UUID,
        1n,
        "10.000000",
        "fake-tx",
      );
    });
  });

  describe("GET /api/v1/inventory/stock-movements", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(
        `/api/v1/inventory/stock-movements?warehouseUuid=${WAREHOUSE_UUID}`,
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.listStockMovementsByWarehouse).not.toHaveBeenCalled();
    });

    it("returns 422 when warehouseUuid is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/stock-movements")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.listStockMovementsByWarehouse).not.toHaveBeenCalled();
    });

    it("returns 200 with the Warehouse's Stock Movements as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const movement = buildStockMovement({ destinationWarehouseUuid: WAREHOUSE_UUID, sourceWarehouseUuid: null });
      (deps.repository.listStockMovementsByWarehouse as jest.Mock).mockResolvedValue([movement]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/stock-movements?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(movement.uuid);
      expect(res.body.data[0].destinationWarehouseUuid).toBe(WAREHOUSE_UUID);
      expect(res.body.data[0].id).toBeUndefined();
      expect(res.body.data[0].tenantId).toBeUndefined();
      expect(res.body.data[0].createdBy).toBeUndefined();
      expect(deps.repository.listStockMovementsByWarehouse).toHaveBeenCalledWith(1n, WAREHOUSE_UUID);
    });

    it("does not merge results across two different Warehouses (warehouse isolation)", async () => {
      const deps = buildDeps();
      const warehouseAMovements = [buildStockMovement({ destinationWarehouseUuid: WAREHOUSE_UUID, sourceWarehouseUuid: null })];
      const warehouseBMovements = [
        buildStockMovement({ destinationWarehouseUuid: OTHER_WAREHOUSE_UUID, sourceWarehouseUuid: null }),
      ];
      (deps.repository.listStockMovementsByWarehouse as jest.Mock).mockImplementation(
        async (_tenantId: bigint, warehouseUuid: string) =>
          warehouseUuid === WAREHOUSE_UUID ? warehouseAMovements : warehouseBMovements,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/inventory/stock-movements?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/inventory/stock-movements?warehouseUuid=${OTHER_WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.body.data).toHaveLength(1);
      expect(resA.body.data[0].destinationWarehouseUuid).toBe(WAREHOUSE_UUID);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].destinationWarehouseUuid).toBe(OTHER_WAREHOUSE_UUID);
      expect(deps.repository.listStockMovementsByWarehouse).toHaveBeenNthCalledWith(1, 1n, WAREHOUSE_UUID);
      expect(deps.repository.listStockMovementsByWarehouse).toHaveBeenNthCalledWith(2, 1n, OTHER_WAREHOUSE_UUID);
    });
  });

  describe("GET /api/v1/inventory/stock-movements/:movementUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/stock-movements/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(deps.repository.findStockMovementByUuid).not.toHaveBeenCalled();
    });

    it("returns 404 (INV_STOCK_MOVEMENT_NOT_FOUND) when the Stock Movement does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findStockMovementByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/stock-movements/${buildStockMovement().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_STOCK_MOVEMENT_NOT_FOUND");
    });

    it("returns 200 with the Stock Movement, exposing only business fields", async () => {
      const deps = buildDeps();
      const movement = buildStockMovement({
        companyUuid: COMPANY_UUID,
        productId: 1n,
        sourceWarehouseUuid: WAREHOUSE_UUID,
        destinationWarehouseUuid: OTHER_WAREHOUSE_UUID,
        referenceType: null,
        referenceUuid: null,
      });
      (deps.repository.findStockMovementByUuid as jest.Mock).mockResolvedValue(movement);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/stock-movements/${movement.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        uuid: movement.uuid,
        companyUuid: COMPANY_UUID,
        productId: "1",
        sourceWarehouseUuid: WAREHOUSE_UUID,
        destinationWarehouseUuid: OTHER_WAREHOUSE_UUID,
        movementType: movement.movementType,
        quantity: movement.quantity,
        referenceType: null,
        referenceUuid: null,
        createdAt: movement.createdAt.toISOString(),
      });
      expect(Object.keys(res.body.data).sort()).toEqual(
        [
          "uuid",
          "companyUuid",
          "productId",
          "sourceWarehouseUuid",
          "destinationWarehouseUuid",
          "movementType",
          "quantity",
          "referenceType",
          "referenceUuid",
          "createdAt",
        ].sort(),
      );
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
      expect(res.body.data.updatedAt).toBeUndefined();
      expect(deps.repository.findStockMovementByUuid).toHaveBeenCalledWith(1n, movement.uuid);
    });
  });
});
