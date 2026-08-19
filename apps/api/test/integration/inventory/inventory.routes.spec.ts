// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Accounting's, Organization's, User Management's, and Authorization's own
// integration tests.
//
// This file's router is mounted bare (no `jwt-auth.middleware.ts` ahead of
// it), same as every other module's own `<module>.routes.spec.ts` — genuine
// 401 (missing/invalid JWT) coverage only exists at the real-app level
// (`test/integration/server.spec.ts`), which so far only covers
// Authentication/Organization/User Management, not yet Authorization or
// Accounting either; adding Inventory there is out of scope for this
// milestone, consistent with that precedent. "Unauthorized" at this layer
// means the request never carries the `X-Tenant-Id` tenant-context header
// this module's endpoints require — asserted as 422 `VALIDATION_ERROR`
// below, mirroring Accounting's own "X-Tenant-Id header is missing" tests
// exactly.
//
// "Forbidden tenant access" has no distinct test here: this module has no
// permission-gated action (no route calls `createPermissionMiddleware`,
// which remains globally unmounted, mirroring every other module's current
// state) — there is no 403 case to exercise. Cross-tenant isolation is
// exercised instead (a real repository's `WHERE tenantId = ? AND uuid = ?`
// query makes a cross-tenant lookup and a genuinely nonexistent lookup
// return the identical 404, per MT-002) — labeled explicitly below,
// mirroring Organization's own "cross-tenant isolation" tests.
//
// Soft-delete visibility rules: NOT APPLICABLE. Product Category has no
// delete/remove endpoint, Business use case, or Repository method anywhere
// in this module yet (Ch.35 defines no removal behavior) — there is
// nothing to test here without inventing an unimplemented feature.
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildProductCategory,
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

describe("Inventory routes", () => {
  describe("POST /api/v1/inventory/product-categories", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/product-categories")
        .send({ companyUuid: COMPANY_UUID, name: "Hardware" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/product-categories")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 when a Product Category with the same name already exists at the same (root) hierarchy level", async () => {
      const deps = buildDeps();
      (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([
        buildProductCategory({ name: "Hardware", parentProductCategoryId: null }),
      ]);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/product-categories")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: COMPANY_UUID, name: "Hardware" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_PRODUCT_CATEGORY_NAME");
    });

    it("returns 404 when the parent Product Category does not exist", async () => {
      const deps = buildDeps();
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/product-categories")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          name: "Fasteners",
          parentProductCategoryUuid: buildProductCategory().uuid,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_CATEGORY_NOT_FOUND");
    });

    it("returns 201 with the created Product Category, exposing only business fields (never id/tenantId/parentProductCategoryId/createdBy)", async () => {
      const deps = buildDeps();
      (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([]);
      const created = buildProductCategory({ companyUuid: COMPANY_UUID, name: "Hardware" });
      (deps.repository.createProductCategory as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/product-categories")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: COMPANY_UUID, name: "Hardware" });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.companyUuid).toBe(COMPANY_UUID);
      expect(res.body.data.name).toBe("Hardware");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.parentProductCategoryId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("GET /api/v1/inventory/product-categories", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/inventory/product-categories");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the tenant's Product Categories as an array", async () => {
      const deps = buildDeps();
      const categories = [buildProductCategory()];
      (deps.repository.listProductCategories as jest.Mock).mockResolvedValue(categories);

      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/product-categories")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(categories[0].uuid);
    });

    it("passes ?companyUuid= through as a filter", async () => {
      const deps = buildDeps();
      (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/product-categories?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listProductCategories).toHaveBeenCalledWith(1n, COMPANY_UUID);
    });
  });

  describe("GET /api/v1/inventory/product-categories/:productCategoryUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/product-categories/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Product Category does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/product-categories/${buildProductCategory().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_CATEGORY_NOT_FOUND");
    });

    it("returns 200 with the Product Category", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory();
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/product-categories/${productCategory.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(productCategory.uuid);
      expect(res.body.data.companyUuid).toBe(productCategory.companyUuid);
    });
  });

  describe("PUT /api/v1/inventory/product-categories/:productCategoryUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/product-categories/${buildProductCategory().uuid}`)
        .send({ name: "Revised" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/product-categories/${buildProductCategory().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Product Category does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/product-categories/${buildProductCategory().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Revised" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_CATEGORY_NOT_FOUND");
    });

    it("returns 409 when the revised name is already used by another Product Category at the same hierarchy level", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory({
        uuid: "00000000-0000-0000-0000-000000000600",
        name: "Hardware",
        parentProductCategoryId: null,
      });
      const other = buildProductCategory({
        uuid: "00000000-0000-0000-0000-000000000601",
        name: "Fasteners",
        parentProductCategoryId: null,
      });
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
      (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([productCategory, other]);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/product-categories/${productCategory.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Fasteners" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_PRODUCT_CATEGORY_NAME");
    });

    it("returns 404 when the new parent Product Category does not exist", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory({ uuid: "00000000-0000-0000-0000-000000000600" });
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) =>
        uuid === productCategory.uuid ? productCategory : null,
      );

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/product-categories/${productCategory.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ parentProductCategoryUuid: "00000000-0000-0000-0000-000000000601" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_CATEGORY_NOT_FOUND");
    });

    it("returns 200 with the updated Product Category", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory({ name: "Hardware" });
      const updated = buildProductCategory({ name: "Hardware (Revised)" });
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
      (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([productCategory]);
      (deps.repository.updateProductCategory as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/product-categories/${productCategory.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Hardware (Revised)" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Hardware (Revised)");
    });

    it("clears the parent when parentProductCategoryUuid is explicitly null", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory();
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
      (deps.repository.updateProductCategory as jest.Mock).mockResolvedValue(productCategory);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/product-categories/${productCategory.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ parentProductCategoryUuid: null });

      expect(res.status).toBe(200);
      expect(deps.repository.updateProductCategory).toHaveBeenCalledWith(1n, productCategory.uuid, {
        name: undefined,
        parentProductCategoryId: null,
        defaultTaxGroupUuid: undefined,
        updatedBy: null,
      });
    });
  });
});
