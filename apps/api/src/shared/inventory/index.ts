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
import { createWarehouseController } from "./presentation/controllers/v1/create-warehouse.controller";
import { getWarehouseController } from "./presentation/controllers/v1/get-warehouse.controller";
import { updateWarehouseController } from "./presentation/controllers/v1/update-warehouse.controller";
import { listWarehousesByBranchController } from "./presentation/controllers/v1/list-warehouses-by-branch.controller";
import { createStockController } from "./presentation/controllers/v1/create-stock.controller";
import { getStockController } from "./presentation/controllers/v1/get-stock.controller";
import { updateStockController } from "./presentation/controllers/v1/update-stock.controller";
import { listStocksByWarehouseController } from "./presentation/controllers/v1/list-stocks-by-warehouse.controller";
import { createInventoryAdjustmentController } from "./presentation/controllers/v1/create-inventory-adjustment.controller";
import { getInventoryAdjustmentController } from "./presentation/controllers/v1/get-inventory-adjustment.controller";
import { updateInventoryAdjustmentController } from "./presentation/controllers/v1/update-inventory-adjustment.controller";
import { listInventoryAdjustmentsByWarehouseController } from "./presentation/controllers/v1/list-inventory-adjustments-by-warehouse.controller";
import { createStockMovementController } from "./presentation/controllers/v1/create-stock-movement.controller";
import { getStockMovementController } from "./presentation/controllers/v1/get-stock-movement.controller";
import { listStockMovementsByWarehouseController } from "./presentation/controllers/v1/list-stock-movements-by-warehouse.controller";
import { createBatchController } from "./presentation/controllers/v1/create-batch.controller";
import { getBatchController } from "./presentation/controllers/v1/get-batch.controller";
import { updateBatchController } from "./presentation/controllers/v1/update-batch.controller";
import { listBatchesByWarehouseController } from "./presentation/controllers/v1/list-batches-by-warehouse.controller";
import { createReorderLevelController } from "./presentation/controllers/v1/create-reorder-level.controller";
import { getReorderLevelController } from "./presentation/controllers/v1/get-reorder-level.controller";
import { updateReorderLevelController } from "./presentation/controllers/v1/update-reorder-level.controller";
import { listReorderLevelsByCompanyController } from "./presentation/controllers/v1/list-reorder-levels-by-company.controller";
import { listReorderLevelsByWarehouseController } from "./presentation/controllers/v1/list-reorder-levels-by-warehouse.controller";

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

  // --- Warehouse ---
  router.post("/warehouses", createWarehouseController(deps));
  router.get("/warehouses", listWarehousesByBranchController(deps));
  router.get("/warehouses/:warehouseUuid", getWarehouseController(deps));
  router.put("/warehouses/:warehouseUuid", updateWarehouseController(deps));

  // --- Stock ---
  router.post("/stocks", createStockController(deps));
  router.get("/stocks", listStocksByWarehouseController(deps));
  router.get("/stocks/:stockUuid", getStockController(deps));
  router.put("/stocks/:stockUuid", updateStockController(deps));

  // --- Inventory Adjustment ---
  router.post("/adjustments", createInventoryAdjustmentController(deps));
  router.get("/adjustments", listInventoryAdjustmentsByWarehouseController(deps));
  router.get("/adjustments/:adjustmentUuid", getInventoryAdjustmentController(deps));
  router.put("/adjustments/:adjustmentUuid", updateInventoryAdjustmentController(deps));

  // --- Stock Movement --- (Ch.39, immutable ledger — STM-002 — no PUT/DELETE route exists at all, structural, not a permission check)
  router.post("/stock-movements", createStockMovementController(deps));
  router.get("/stock-movements", listStockMovementsByWarehouseController(deps));
  router.get("/stock-movements/:movementUuid", getStockMovementController(deps));

  // --- Batch --- (Ch.40) No DELETE route — Batch has no remove use case.
  // `GET /batches` is filled by the by-Warehouse list only
  // (list-batches-by-warehouse.controller.ts) — mirroring Inventory
  // Adjustment's/Stock Movement's own precedent of exposing one list
  // variant at the bare list route; the by-Product list controller exists
  // (list-batches-by-product.controller.ts) but is deliberately not routed
  // this milestone, per this milestone's own explicit 4-route limit.
  router.post("/batches", createBatchController(deps));
  router.get("/batches", listBatchesByWarehouseController(deps));
  router.get("/batches/:batchUuid", getBatchController(deps));
  router.put("/batches/:batchUuid", updateBatchController(deps));

  // --- Reorder Level --- (Ch.42) No DELETE route — Reorder Level has no
  // remove use case this milestone. `/reorder-levels/by-warehouse` (a static
  // path) is registered before `/reorder-levels/:reorderLevelUuid` (a param
  // route) deliberately — Express matches routes in registration order, so
  // the literal segment must come first or every request for it would
  // instead match `:reorderLevelUuid="by-warehouse"` (mirroring
  // `/units/base-units`-before-`/units/:unitUuid` exactly). The bare
  // `GET /reorder-levels` route carries the Company-scoped list; the
  // Warehouse-scoped list is the second, equally-authorized list variant
  // this milestone names, exposed at its own static sub-path (see
  // list-reorder-levels-by-warehouse.controller.ts's own header comment).
  router.post("/reorder-levels", createReorderLevelController(deps));
  router.get("/reorder-levels", listReorderLevelsByCompanyController(deps));
  router.get("/reorder-levels/by-warehouse", listReorderLevelsByWarehouseController(deps));
  router.get("/reorder-levels/:reorderLevelUuid", getReorderLevelController(deps));
  router.put("/reorder-levels/:reorderLevelUuid", updateReorderLevelController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/inventory', createDefaultInventoryRouter())`) — not used by tests. */
export function createDefaultInventoryRouter(): Router {
  return createInventoryRouter(createInventoryDependencies());
}
