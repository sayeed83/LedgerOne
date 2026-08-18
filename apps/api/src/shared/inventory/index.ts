// Module entry point — mounts this module's Express router
// (04_FOLDER_STRUCTURE.md Ch.6.3: "index.ts mounts the module's Express
// router"), matching Accounting's, Organization's, User Management's, and
// Authorization's own index.ts. `createInventoryRouter` takes `deps`
// explicitly (no eager construction here) so importing this file never has
// a side effect of touching Prisma — tests build the router with fake deps
// instead.
import { Router } from "express";
import { InventoryDependencies, createInventoryDependencies } from "./business/inventory.composition";
import { createProductCategoryController } from "./presentation/controllers/v1/create-product-category.controller";
import { getProductCategoryController } from "./presentation/controllers/v1/get-product-category.controller";
import { updateProductCategoryController } from "./presentation/controllers/v1/update-product-category.controller";
import { listProductCategoriesController } from "./presentation/controllers/v1/list-product-categories.controller";
import { createUnitController } from "./presentation/controllers/v1/create-unit.controller";
import { getUnitController } from "./presentation/controllers/v1/get-unit.controller";
import { updateUnitController } from "./presentation/controllers/v1/update-unit.controller";
import { listUnitsByCompanyController } from "./presentation/controllers/v1/list-units-by-company.controller";
import { listBaseUnitsController } from "./presentation/controllers/v1/list-base-units.controller";
import { createProductController } from "./presentation/controllers/v1/create-product.controller";
import { getProductController } from "./presentation/controllers/v1/get-product.controller";
import { updateProductController } from "./presentation/controllers/v1/update-product.controller";
import { listProductsByCompanyController } from "./presentation/controllers/v1/list-products-by-company.controller";

export function createInventoryRouter(deps: InventoryDependencies): Router {
  const router = Router();

  // --- Product Category ---
  router.post("/product-categories", createProductCategoryController(deps));
  router.get("/product-categories", listProductCategoriesController(deps));
  router.get("/product-categories/:productCategoryUuid", getProductCategoryController(deps));
  router.put("/product-categories/:productCategoryUuid", updateProductCategoryController(deps));

  // --- Unit ---
  // `/units/base-units` (a static path) is registered before
  // `/units/:unitUuid` (a param route) deliberately — Express matches
  // routes in registration order, so the literal segment must come first
  // or every request for it would instead match `:unitUuid="base-units"`.
  router.post("/units", createUnitController(deps));
  router.get("/units", listUnitsByCompanyController(deps));
  router.get("/units/base-units", listBaseUnitsController(deps));
  router.get("/units/:unitUuid", getUnitController(deps));
  router.put("/units/:unitUuid", updateUnitController(deps));

  // --- Product ---
  router.post("/products", createProductController(deps));
  router.get("/products", listProductsByCompanyController(deps));
  router.get("/products/:productUuid", getProductController(deps));
  router.put("/products/:productUuid", updateProductController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/inventory', createDefaultInventoryRouter())`) — not used by tests. */
export function createDefaultInventoryRouter(): Router {
  return createInventoryRouter(createInventoryDependencies());
}
