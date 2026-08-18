// Presentation-layer integration tests — exercise the real Express router
// end-to-end with a fake Repository (05_CODING_STANDARDS.md Ch.10.6) so no
// database cost is needed. No live `app`/server mount is exercised here
// (see test/integration/server.spec.ts for that) — the router is exercised
// directly via supertest wrapped in a bare Express instance, mirroring
// Product Category's (`inventory.routes.spec.ts`) and Unit's
// (`unit.routes.spec.ts`) own integration tests exactly.
//
// This file's router is mounted bare (no `jwt-auth.middleware.ts` ahead of
// it), same as Product Category's/Unit's own files — genuine 401
// (missing/invalid JWT) coverage only exists at the real-app level
// (`test/integration/server.spec.ts`), which doesn't cover Inventory at
// all yet, consistent with that existing precedent. "Unauthorized" at this
// layer means the request never carries the `X-Tenant-Id` tenant-context
// header this module's endpoints require — asserted as 422
// `VALIDATION_ERROR` below.
//
// "Forbidden tenant access" has no distinct test here, same reasoning as
// Product Category's/Unit's own files: this module has no permission-gated
// route. Cross-tenant isolation is exercised via the same not-found
// assertions (a real tenant-scoped repository query makes a cross-tenant
// lookup and a genuinely nonexistent lookup identical, both 404, per
// MT-002).
//
// Soft-delete visibility rules: NOT APPLICABLE — Product has no
// delete/remove endpoint, Business use case, or Repository method (Ch.34
// defines no removal behavior at this milestone).
import express from "express";
import request from "supertest";
import { createInventoryRouter } from "../../../src/shared/inventory";
import { InventoryDependencies } from "../../../src/shared/inventory/business/inventory.composition";
import {
  buildProduct,
  buildProductCategory,
  buildUnit,
  createFakeInventoryRepository,
} from "../../../src/shared/inventory/business/test-support/fixtures";

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
const COMPANY_UUID = "00000000-0000-0000-0000-000000000100";
const CATEGORY_UUID = "00000000-0000-0000-0000-000000000601";
const UNIT_UUID = "00000000-0000-0000-0000-000000000701";

describe("Inventory routes — Product", () => {
  describe("POST /api/v1/inventory/products", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/products")
        .send({
          companyUuid: COMPANY_UUID,
          productCode: "SB-M8-40",
          name: "Steel Bolt M8x40",
          productCategoryUuid: CATEGORY_UUID,
          isStocked: true,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/products")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ companyUuid: "not-a-uuid" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the supplied Product Category does not exist (product-category-not-found)", async () => {
      const deps = buildDeps();
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/products")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productCode: "SB-M8-40",
          name: "Steel Bolt M8x40",
          productCategoryUuid: CATEGORY_UUID,
          isStocked: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_CATEGORY_NOT_FOUND");
      expect(deps.repository.createProduct).not.toHaveBeenCalled();
    });

    it("returns 404 when the supplied Unit does not exist (unit-not-found)", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory({ id: 2n, uuid: CATEGORY_UUID });
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/products")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productCode: "SB-M8-40",
          name: "Steel Bolt M8x40",
          productCategoryUuid: CATEGORY_UUID,
          unitUuid: UNIT_UUID,
          isStocked: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_UNIT_NOT_FOUND");
      expect(deps.repository.createProduct).not.toHaveBeenCalled();
    });

    it("returns 409 when another Product in the Company already uses the code (duplicate-product-code)", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory({ id: 2n, uuid: CATEGORY_UUID });
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
      (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(buildProduct());

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/products")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productCode: "SB-M8-40",
          name: "Steel Bolt M8x40",
          productCategoryUuid: CATEGORY_UUID,
          isStocked: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_PRODUCT_CODE");
      expect(deps.repository.createProduct).not.toHaveBeenCalled();
    });

    it("returns 201 creating a Product without a Unit, exposing only business fields (never id/tenantId/productCategoryId/unitId/createdBy/updatedBy/deletedAt)", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory({ id: 2n, uuid: CATEGORY_UUID });
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
      (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(null);
      const created = buildProduct({ companyUuid: COMPANY_UUID, productCode: "SB-M8-40", name: "Steel Bolt M8x40" });
      (deps.repository.createProduct as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/products")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productCode: "SB-M8-40",
          name: "Steel Bolt M8x40",
          productCategoryUuid: CATEGORY_UUID,
          isStocked: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.companyUuid).toBe(COMPANY_UUID);
      expect(res.body.data.productCode).toBe("SB-M8-40");
      expect(res.body.data.name).toBe("Steel Bolt M8x40");
      expect(res.body.data.isStocked).toBe(true);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.productCategoryId).toBeUndefined();
      expect(res.body.data.unitId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
      expect(deps.repository.findUnitByUuid).not.toHaveBeenCalled();
      expect(deps.repository.createProduct).toHaveBeenCalledWith(1n, {
        companyUuid: COMPANY_UUID,
        productCode: "SB-M8-40",
        name: "Steel Bolt M8x40",
        description: null,
        productCategoryId: 2n,
        unitId: null,
        isStocked: true,
        status: undefined,
        createdBy: null,
      });
    });

    it("returns 201 creating a Product with a resolved Unit", async () => {
      const deps = buildDeps();
      const productCategory = buildProductCategory({ id: 2n, uuid: CATEGORY_UUID });
      const unit = buildUnit({ id: 3n, uuid: UNIT_UUID });
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
      (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(null);
      const created = buildProduct({ companyUuid: COMPANY_UUID, productCode: "SB-M8-40", name: "Steel Bolt M8x40" });
      (deps.repository.createProduct as jest.Mock).mockResolvedValue(created);

      const res = await request(buildApp(deps))
        .post("/api/v1/inventory/products")
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({
          companyUuid: COMPANY_UUID,
          productCode: "SB-M8-40",
          name: "Steel Bolt M8x40",
          productCategoryUuid: CATEGORY_UUID,
          unitUuid: UNIT_UUID,
          isStocked: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe(created.uuid);
      expect(res.body.data.unitId).toBeUndefined();
      expect(deps.repository.createProduct).toHaveBeenCalledWith(1n, {
        companyUuid: COMPANY_UUID,
        productCode: "SB-M8-40",
        name: "Steel Bolt M8x40",
        description: null,
        productCategoryId: 2n,
        unitId: 3n,
        isStocked: true,
        status: undefined,
        createdBy: null,
      });
    });
  });

  describe("GET /api/v1/inventory/products", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get(`/api/v1/inventory/products?companyUuid=${COMPANY_UUID}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 when the required companyUuid query param is missing", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps)).get("/api/v1/inventory/products").set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with the Company's Products as an array, exposing only business fields", async () => {
      const deps = buildDeps();
      const products = [buildProduct()];
      (deps.repository.listProductsByCompany as jest.Mock).mockResolvedValue(products);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/products?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].uuid).toBe(products[0].uuid);
      expect(res.body.data[0].id).toBeUndefined();
      expect(res.body.data[0].tenantId).toBeUndefined();
      expect(res.body.data[0].productCategoryId).toBeUndefined();
      expect(res.body.data[0].unitId).toBeUndefined();
      expect(res.body.data[0].createdBy).toBeUndefined();
      expect(res.body.data[0].updatedBy).toBeUndefined();
      expect(res.body.data[0].deletedAt).toBeUndefined();
    });

    it("passes ?companyUuid= through as the filter (verifies companyUuid filtering)", async () => {
      const deps = buildDeps();
      (deps.repository.listProductsByCompany as jest.Mock).mockResolvedValue([]);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/products?companyUuid=${COMPANY_UUID}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(deps.repository.listProductsByCompany).toHaveBeenCalledWith(1n, COMPANY_UUID);
    });
  });

  describe("GET /api/v1/inventory/products/:productUuid", () => {
    it("returns 422 for a malformed uuid", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .get("/api/v1/inventory/products/not-a-uuid")
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Product does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/products/${buildProduct().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_NOT_FOUND");
    });

    it("returns 200 with the Product, exposing only business fields", async () => {
      const deps = buildDeps();
      const product = buildProduct();
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);

      const res = await request(buildApp(deps))
        .get(`/api/v1/inventory/products/${product.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER);

      expect(res.status).toBe(200);
      expect(res.body.data.uuid).toBe(product.uuid);
      expect(res.body.data.companyUuid).toBe(product.companyUuid);
      expect(res.body.data.productCode).toBe(product.productCode);
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.productCategoryId).toBeUndefined();
      expect(res.body.data.unitId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });

  describe("PUT /api/v1/inventory/products/:productUuid", () => {
    it("returns 422 when the X-Tenant-Id header is missing (unauthorized tenant context)", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${buildProduct().uuid}`)
        .send({ name: "Revised" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 on malformed body", async () => {
      const deps = buildDeps();
      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${buildProduct().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 when the Product does not exist under the tenant (cross-tenant isolation)", async () => {
      const deps = buildDeps();
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${buildProduct().uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Revised" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_NOT_FOUND");
    });

    it("returns 404 when the new Product Category does not exist (product-category-not-found)", async () => {
      const deps = buildDeps();
      const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600" });
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
      (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${product.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ productCategoryUuid: CATEGORY_UUID });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_PRODUCT_CATEGORY_NOT_FOUND");
      expect(deps.repository.updateProduct).not.toHaveBeenCalled();
    });

    it("returns 404 when the new Unit does not exist (unit-not-found)", async () => {
      const deps = buildDeps();
      const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600" });
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
      (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${product.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ unitUuid: UNIT_UUID });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INV_UNIT_NOT_FOUND");
      expect(deps.repository.updateProduct).not.toHaveBeenCalled();
    });

    it("returns 409 when renaming the code to one another Product in the Company already uses (duplicate-product-code)", async () => {
      const deps = buildDeps();
      const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600", productCode: "SB-M8-40" });
      const other = buildProduct({ uuid: "00000000-0000-0000-0000-000000000602", productCode: "SB-M10-50" });
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
      (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(other);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${product.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ productCode: "SB-M10-50" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INV_DUPLICATE_PRODUCT_CODE");
      expect(deps.repository.updateProduct).not.toHaveBeenCalled();
    });

    it("clears the Unit when unitUuid is explicitly null", async () => {
      const deps = buildDeps();
      const product = buildProduct();
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
      (deps.repository.updateProduct as jest.Mock).mockResolvedValue(product);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${product.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ unitUuid: null });

      expect(res.status).toBe(200);
      expect(deps.repository.findUnitByUuid).not.toHaveBeenCalled();
      expect(deps.repository.updateProduct).toHaveBeenCalledWith(1n, product.uuid, {
        productCode: undefined,
        name: undefined,
        description: undefined,
        productCategoryId: undefined,
        unitId: null,
        isStocked: undefined,
        status: undefined,
        updatedBy: null,
      });
    });

    it("returns 200 with the updated Product, exposing only business fields", async () => {
      const deps = buildDeps();
      const product = buildProduct({ name: "Steel Bolt M8x40" });
      const updated = buildProduct({ name: "Steel Bolt M8x40 (Revised)" });
      (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
      (deps.repository.updateProduct as jest.Mock).mockResolvedValue(updated);

      const res = await request(buildApp(deps))
        .put(`/api/v1/inventory/products/${product.uuid}`)
        .set("X-Tenant-Id", TENANT_HEADER)
        .send({ name: "Steel Bolt M8x40 (Revised)" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Steel Bolt M8x40 (Revised)");
      expect(res.body.data.id).toBeUndefined();
      expect(res.body.data.tenantId).toBeUndefined();
      expect(res.body.data.productCategoryId).toBeUndefined();
      expect(res.body.data.unitId).toBeUndefined();
      expect(res.body.data.createdBy).toBeUndefined();
      expect(res.body.data.updatedBy).toBeUndefined();
      expect(res.body.data.deletedAt).toBeUndefined();
    });
  });
});
