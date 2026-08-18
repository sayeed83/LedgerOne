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

export function createInventoryRouter(deps: InventoryDependencies): Router {
  const router = Router();

  // --- Product Category ---
  router.post("/product-categories", createProductCategoryController(deps));
  router.get("/product-categories", listProductCategoriesController(deps));
  router.get("/product-categories/:productCategoryUuid", getProductCategoryController(deps));
  router.put("/product-categories/:productCategoryUuid", updateProductCategoryController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/inventory', createDefaultInventoryRouter())`) — not used by tests. */
export function createDefaultInventoryRouter(): Router {
  return createInventoryRouter(createInventoryDependencies());
}
