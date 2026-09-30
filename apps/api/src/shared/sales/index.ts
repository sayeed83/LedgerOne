// Module entry point — mounts this module's Express router
// (04_FOLDER_STRUCTURE.md Ch.6.3: "index.ts mounts the module's Express
// router"), matching Inventory's/Organization's/Authorization's own
// index.ts. `createSalesRouter` takes `deps` explicitly (no eager
// construction here) so importing this file never has a side effect of
// touching Prisma — tests build the router with fake deps instead.
//
// Routes are resource-named (`/customers`), not module-named (`/sales`) —
// this router is intended to be mounted at `/api/v1/customers` directly
// (module-registry.ts), not `/api/v1/sales`, per this milestone's explicit
// route list.
//
// Route ordering note: `/by-company` (a static path) is registered before
// `/:customerUuid` (a param route) deliberately — Express matches routes in
// registration order, so the literal segment must come first or every
// request for it would instead match `:customerUuid="by-company"`,
// mirroring Inventory's own `/reorder-levels/by-warehouse`-before-
// `/reorder-levels/:reorderLevelUuid` precedent exactly.
import { Router } from "express";
import { SalesDependencies, createSalesDependencies } from "./business/sales.composition";
import { createCustomerController } from "./presentation/controllers/v1/create-customer.controller";
import { getCustomerController } from "./presentation/controllers/v1/get-customer.controller";
import { updateCustomerController } from "./presentation/controllers/v1/update-customer.controller";
import { listCustomersController } from "./presentation/controllers/v1/list-customers.controller";
import { listCustomersByCompanyController } from "./presentation/controllers/v1/list-customers-by-company.controller";

export function createSalesRouter(deps: SalesDependencies): Router {
  const router = Router();

  // --- Customer --- (Ch.45) No DELETE route — CUS-003 forbids deletion
  // while transaction history exists (deactivation only, a status-transition
  // concern explicitly out of scope this milestone).
  router.post("/", createCustomerController(deps));
  router.get("/", listCustomersController(deps));
  router.get("/by-company", listCustomersByCompanyController(deps));
  router.get("/:customerUuid", getCustomerController(deps));
  router.put("/:customerUuid", updateCustomerController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/customers', createDefaultSalesRouter())`) — not used by tests. */
export function createDefaultSalesRouter(): Router {
  return createSalesRouter(createSalesDependencies());
}
