// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Product's (`product.routes.spec.ts`) own integration tests exactly.
//
// This file's router is mounted bare (no `jwt-auth.middleware.ts` ahead of
// it), same as Product's own file — genuine 401 (missing/invalid JWT)
// coverage only exists at the real-app level (`test/integration/server.spec.ts`),
// which doesn't cover Inventory at all yet, consistent with that existing
// precedent. "Unauthorized" at this layer means the request never carries
// the `X-Tenant-Id` tenant-context header this module's endpoints require —
// asserted as 422 `VALIDATION_ERROR` below.
//
// "Forbidden tenant access" has no distinct test here, same reasoning as
// Product's own file: this module has no permission-gated route.
// Cross-tenant isolation is exercised via the same not-found assertions (a
// real tenant-scoped repository query makes a cross-tenant lookup and a
// genuinely nonexistent lookup identical, both 404, per MT-002).
//
// Soft-delete visibility rules: NOT APPLICABLE — Warehouse has no
// delete/remove endpoint, Business use case, or Repository method (Ch.37
// defines no removal behavior at this milestone).
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import { buildWarehouse, createFakeInventoryRepository } from "../../../src/shared/inventory/business/test-support/fixtures";

function buildApp(deps: InventoryDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/inventory", createInventoryRouter(deps));
  return app;
}

function buildDeps(): InventoryDependencies {
  return { repository: createFakeInventoryRepository() };
}

const TENANT_HEADER = "1";
const BRANCH_UUID = "00000000-0000-0000-0000-000000000200";
const OTHER_BRANCH_UUID = "00000000-0000-0000-0000-000000000201";

describe("Inventory routes — Warehouse", () => {
  describe("POST /api/v1/inventory/warehouses", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/warehouses")
        .send({
          branchUuid: BRANCH_UUID,
          warehouseCode: "WH-001",
          name: "Head Office Warehouse",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/warehouses")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ branchUuid: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when another Warehouse in the Branch already uses the code (duplicate-warehouse-code)", async () => {
      const deps = buildDeps();
      (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(buildWarehouse());

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/warehouses")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          branchUuid: BRANCH_UUID,
          warehouseCode: "WH-001",
          name: "Head Office Warehouse",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_WAREHOUSE_CODE");
      expect(deps.repository.createWarehouse).not.toHaveBeenCalled();
    });

    it("returns 409 when another Warehouse in the Branch already uses the name (duplicate-warehouse-name)", async () => {
      const deps = buildDeps();
      (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(null);
      (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([
        buildWarehouse({ name: "Head Office Warehouse" }),
      ]);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/warehouses")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          branchUuid: BRANCH_UUID,
          warehouseCode: "WH-001",
          name: "Head Office Warehouse",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_WAREHOUSE_NAME");
      expect(deps.repository.createWarehouse).not.toHaveBeenCalled();
    });

    it("returns 201 creating a Warehouse, exposing only business fields (never id/tenantId/createdBy/updatedBy/deletedAt)", async () => {
      const deps = buildDeps();
      (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(null);
      (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([]);
      const created = buildWarehouse({
        branchUuid: BRANCH_UUID,
        warehouseCode: "WH-001",
        name: "Head Office Warehouse",
      });
      (deps.repository.createWarehouse as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/warehouses")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          branchUuid: BRANCH_UUID,
          warehouseCode: "WH-001",
          name: "Head Office Warehouse",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.branchUuid).toBe(BRANCH_UUID);
      expect(res.body.data.warehouseCode).toBe("WH-001");
      expect(res.body.data.name).toBe("Head Office Warehouse");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
      expect(deps.repository.createWarehouse).toHaveBeenCalledWith(1n, {
        branchUuid: BRANCH_UUID,
        warehouseCode: "WH-001",
        name: "Head Office Warehouse",
        description: null,
        status: undefined,
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/inventory/warehouses", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/inventory/warehouses?branchUuid=${BRANCH_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required branchUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/inventory/warehouses").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Branch's Warehouses as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const warehouses = [buildWarehouse()];
      (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue(warehouses);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/warehouses?branchUuid=${BRANCH_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(warehouses[0].uuid);
      expect(res.body.data[0].id).toBeUndefined();
      expect(res.body.data[0].tenantId).toBeUndefined();
      expect(res.body.data[0].createdBy).toBeUndefined();
      expect(res.body.data[0].updatedBy).toBeUndefined();
      expect(res.body.data[0].deletedAt).toBeUndefined();
    });

    it("passes ?branchUuid= through as the filter (verifies branchUuid filtering)", async () => {
      const deps = buildDeps();
      (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/warehouses?branchUuid=${BRANCH_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listWarehousesByBranch).toHaveBeenCalledWith(1n, BRANCH_UUID);
    });

    it("does not merge results across two different Branches — each request is independently scoped (branch isolation)", async () => {
      const deps = buildDeps();
      const branchAWarehouses = [buildWarehouse({ branchUuid: BRANCH_UUID })];
      const branchBWarehouses = [buildWarehouse({ branchUuid: OTHER_BRANCH_UUID })];
      (deps.repository.listWarehousesByBranch as jest.Mock).mockImplementation(
        async (_tenantId: bigint, branchUuid: string) =>
          branchUuid === BRANCH_UUID ? branchAWarehouses : branchBWarehouses,
      );

      const resA = await request(buildApp(deps))
        .get(`/api/v1/inventory/warehouses?branchUuid=${BRANCH_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);
      const resB = await request(buildApp(deps))
        .get(`/api/v1/inventory/warehouses?branchUuid=${OTHER_BRANCH_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(resA.body.data[0].branchUuid).toBe(BRANCH_UUID);
      expect(resB.body.data[0].branchUuid).toBe(OTHER_BRANCH_UUID);
    });
  });

  describe("GET /api/v1/inventory/warehouses/:warehouseUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/warehouses/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Warehouse does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/warehouses/${buildWarehouse().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_WAREHOUSE_NOT_FOUND");
    });

    it("returns 200 with the Warehouse, exposing only business fields", async () => {
      const deps = buildDeps();
      const warehouse = buildWarehouse();
      (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/warehouses/${warehouse.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(warehouse.uuid);
      expect(res.body.data.branchUuid).toBe(warehouse.branchUuid);
      expect(res.body.data.warehouseCode).toBe(warehouse.warehouseCode);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("PUT /api/v1/inventory/warehouses/:warehouseUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/warehouses/${buildWarehouse().uuid}`)
        .send({ name: "Revised" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/warehouses/${buildWarehouse().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Warehouse does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/warehouses/${buildWarehouse().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Revised" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_WAREHOUSE_NOT_FOUND");
    });

    it("returns 409 when renaming the code to one another Warehouse in the Branch already uses (duplicate-warehouse-code)", async () => {
      const deps = buildDeps();
      const warehouse = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000900", warehouseCode: "WH-001" });
      const other = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000901", warehouseCode: "WH-002" });
      (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
      (deps.repository.findWarehouseByCode as jest.Mock).mockResolvedValue(other);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/warehouses/${warehouse.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ warehouseCode: "WH-002" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_WAREHOUSE_CODE");
      expect(deps.repository.updateWarehouse).not.toHaveBeenCalled();
    });

    it("returns 409 when renaming to a name another Warehouse in the Branch already uses (duplicate-warehouse-name)", async () => {
      const deps = buildDeps();
      const warehouse = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000900", name: "Head Office Warehouse" });
      const other = buildWarehouse({ uuid: "00000000-0000-0000-0000-000000000901", name: "Regional Store Warehouse" });
      (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
      (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([warehouse, other]);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/warehouses/${warehouse.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Regional Store Warehouse" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_WAREHOUSE_NAME");
      expect(deps.repository.updateWarehouse).not.toHaveBeenCalled();
    });

    it("returns 200 with the updated Warehouse, exposing only business fields", async () => {
      const deps = buildDeps();
      const warehouse = buildWarehouse({ name: "Head Office Warehouse" });
      const updated = buildWarehouse({ name: "Head Office Warehouse (Revised)" });
      (deps.repository.findWarehouseByUuid as jest.Mock).mockResolvedValue(warehouse);
      (deps.repository.listWarehousesByBranch as jest.Mock).mockResolvedValue([warehouse]);
      (deps.repository.updateWarehouse as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/warehouses/${warehouse.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Head Office Warehouse (Revised)" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Head Office Warehouse (Revised)");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
      expect(deps.repository.updateWarehouse).toHaveBeenCalledWith(1n, warehouse.uuid, {
        warehouseCode: undefined,
        name: "Head Office Warehouse (Revised)",
        description: undefined,
        status: undefined,
        updatedBy: null,
      });
    });
  });
});
