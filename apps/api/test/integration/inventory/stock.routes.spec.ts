// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Warehouse's (`warehouse.routes.spec.ts`) own integration tests exactly.
//
// This file's router is mounted bare (no `jwt-auth.middleware.ts` ahead of
// it), same as Warehouse's own file — genuine 401 (missing/invalid JWT)
// coverage only exists at the real-app level (`test/integration/server.spec.ts`),
// which doesn't cover Inventory at all yet, consistent with that existing
// precedent. "Unauthorized" at this layer means the request never carries
// the `X-Tenant-Id` tenant-context header this module's endpoints require —
// asserted as 422 `VALIDATION_ERROR` below.
//
// "Forbidden tenant access" has no distinct test here, same reasoning as
// Warehouse's own file: this module has no permission-gated route.
// Cross-tenant isolation is exercised via the same not-found assertions (a
// real tenant-scoped repository query makes a cross-tenant lookup and a
// genuinely nonexistent lookup identical, both 404, per MT-002).
//
// Soft-delete visibility rules: NOT APPLICABLE — Stock has no delete/remove
// endpoint, Business use case, or Repository method at this milestone.
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildStock,
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
      "quantityOnHand",
      "quantityReserved",
      "quantityAvailable",
      "createdAt",
      "updatedAt",
    ].sort(),
  );
  expectHiddenFieldsUndefined(data);
}

describe("Inventory routes — Stock", () => {
  describe("POST /api/v1/inventory/stocks", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).post("/api/v1/inventory/stocks").send({
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: "1",
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stocks")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: "not-a-uuid", warehouseUuid: WAREHOUSE_UUID, productId: "not-numeric" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when a Stock already exists for the Warehouse/Product pair (duplicate-stock)", async () => {
      const deps = buildDeps();
      (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(buildStock());

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stocks")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: COMPANY_UUID, warehouseUuid: WAREHOUSE_UUID, productId: "1" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_STOCK_ALREADY_EXISTS");
      expect(deps.repository.createStock).not.toHaveBeenCalled();
    });

    it("returns 201 creating a Stock, exposing only business fields, and passes the exact expected payload to the repository", async () => {
      const deps = buildDeps();
      (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
      const created = buildStock({
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
        quantityOnHand: "10.000000",
        quantityReserved: "2.000000",
        quantityAvailable: "8.000000",
      });
      (deps.repository.createStock as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/stocks")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          warehouseUuid: WAREHOUSE_UUID,
          productId: "1",
          quantityOnHand: "10.000000",
          quantityReserved: "2.000000",
          quantityAvailable: "8.000000",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.companyUuid).toBe(COMPANY_UUID);
      expect(res.body.data.warehouseUuid).toBe(WAREHOUSE_UUID);
      expect(res.body.data.productId).toBe("1");
      expect(res.body.data.quantityOnHand).toBe("10.000000");
      expect(res.body.data.quantityReserved).toBe("2.000000");
      expect(res.body.data.quantityAvailable).toBe("8.000000");
      expectOnlyBusinessFields(res.body.data);
      expect(deps.repository.findStockByWarehouseAndProduct).toHaveBeenCalledWith(1n, WAREHOUSE_UUID, 1n);
      expect(deps.repository.createStock).toHaveBeenCalledWith(1n, {
        companyUuid: COMPANY_UUID,
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
        quantityOnHand: "10.000000",
        quantityReserved: "2.000000",
        quantityAvailable: "8.000000",
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/inventory/stocks", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/inventory/stocks?warehouseUuid=${WAREHOUSE_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required warehouseUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/inventory/stocks").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Warehouse's Stocks as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const stocks = [buildStock()];
      (deps.repository.listStocksByWarehouse as jest.Mock).mockResolvedValue(stocks);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/stocks?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(stocks[0].uuid);
      expectOnlyBusinessFields(res.body.data[0]);
    });

    it("passes ?warehouseUuid= through as the filter (verifies warehouseUuid filtering)", async () => {
      const deps = buildDeps();
      (deps.repository.listStocksByWarehouse as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/stocks?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listStocksByWarehouse).toHaveBeenCalledWith(1n, WAREHOUSE_UUID);
    });

    it("does not merge results across two different Warehouses — each request is independently scoped (warehouse isolation)", async () => {
      const deps = buildDeps();
      const warehouseAStocks = [buildStock({ warehouseUuid: WAREHOUSE_UUID })];
      const warehouseBStocks = [buildStock({ warehouseUuid: OTHER_WAREHOUSE_UUID })];
      (deps.repository.listStocksByWarehouse as jest.Mock).mockImplementation(
        async (_tenantId: bigint, warehouseUuid: string) =>
          warehouseUuid === WAREHOUSE_UUID ? warehouseAStocks : warehouseBStocks,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/inventory/stocks?warehouseUuid=${WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/inventory/stocks?warehouseUuid=${OTHER_WAREHOUSE_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(resA.body.data[0].warehouseUuid).toBe(WAREHOUSE_UUID);
      expect(resB.body.data[0].warehouseUuid).toBe(OTHER_WAREHOUSE_UUID);
    });
  });

  describe("GET /api/v1/inventory/stocks/:stockUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/stocks/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Stock does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/stocks/${buildStock().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_STOCK_NOT_FOUND");
    });

    it("returns 200 with the Stock, exposing only business fields", async () => {
      const deps = buildDeps();
      const stock = buildStock();
      (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/stocks/${stock.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(stock.uuid);
      expect(res.body.data.companyUuid).toBe(stock.companyUuid);
      expect(res.body.data.warehouseUuid).toBe(stock.warehouseUuid);
      expect(res.body.data.productId).toBe(stock.productId.toString());
      expectOnlyBusinessFields(res.body.data);
    });
  });

  describe("PUT /api/v1/inventory/stocks/:stockUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/stocks/${buildStock().uuid}`)
        .send({ quantityOnHand: "5.000000" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/stocks/${buildStock().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ productId: "not-numeric" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Stock does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/stocks/${buildStock().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ quantityOnHand: "5.000000" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_STOCK_NOT_FOUND");
    });

    it("returns 409 when moving to a Warehouse/Product pair another Stock already occupies (duplicate-stock)", async () => {
      const deps = buildDeps();
      const stock = buildStock({
        uuid: "00000000-0000-0000-0000-000000000900",
        warehouseUuid: WAREHOUSE_UUID,
        productId: 1n,
      });
      const other = buildStock({
        uuid: "00000000-0000-0000-0000-000000000901",
        warehouseUuid: OTHER_WAREHOUSE_UUID,
        productId: 2n,
      });
      (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);
      (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(other);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/stocks/${stock.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ warehouseUuid: OTHER_WAREHOUSE_UUID, productId: "2" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_STOCK_ALREADY_EXISTS");
      expect(deps.repository.updateStock).not.toHaveBeenCalled();
    });

    it("returns 200 with the updated Stock, exposing only business fields, and passes the exact expected arguments", async () => {
      const deps = buildDeps();
      const stock = buildStock({ uuid: "00000000-0000-0000-0000-000000000900", quantityOnHand: "10.000000" });
      const updated = buildStock({ uuid: stock.uuid, quantityOnHand: "20.000000" });
      (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);
      (deps.repository.updateStock as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/stocks/${stock.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ quantityOnHand: "20.000000" });

      expect(res.status).toBe(200);
      expect(res.body.data.quantityOnHand).toBe("20.000000");
      expectOnlyBusinessFields(res.body.data);
      expect(deps.repository.findStockByWarehouseAndProduct).not.toHaveBeenCalled();
      expect(deps.repository.updateStock).toHaveBeenCalledWith(1n, stock.uuid, {
        quantityOnHand: "20.000000",
        quantityReserved: undefined,
        quantityAvailable: undefined,
        updatedBy: null,
      });
    });
  });
});
