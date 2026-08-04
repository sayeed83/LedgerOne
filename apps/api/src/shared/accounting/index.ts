// Module entry point — mounts this module's Express router
// (04_FOLDER_STRUCTURE.md Ch.6.3: "index.ts mounts the module's Express
// router"), matching Organization's, User Management's, and Authorization's
// own index.ts. `createAccountingRouter` takes `deps` explicitly (no eager
// construction here) so importing this file never has a side effect of
// touching Prisma — tests build the router with fake deps instead.
import { Router } from "express";
import { AccountingDependencies, createAccountingDependencies } from "./business/accounting.composition";
import { createFinancialYearController } from "./presentation/controllers/v1/create-financial-year.controller";
import { getFinancialYearController } from "./presentation/controllers/v1/get-financial-year.controller";
import { updateFinancialYearController } from "./presentation/controllers/v1/update-financial-year.controller";
import { listFinancialYearsController } from "./presentation/controllers/v1/list-financial-years.controller";
import { openFinancialYearController } from "./presentation/controllers/v1/open-financial-year.controller";
import { closeFinancialYearController } from "./presentation/controllers/v1/close-financial-year.controller";
import { reopenFinancialYearController } from "./presentation/controllers/v1/reopen-financial-year.controller";

export function createAccountingRouter(deps: AccountingDependencies): Router {
  const router = Router();

  // --- Financial Year ---
  // `validateFinancialYearOpen` is deliberately not exposed here — it is an
  // internal Business-layer guard other (not-yet-built) modules' use cases
  // will call directly, exactly like Organization's `validateTenantIsActive`
  // and User Management's `validateUserActive` have no endpoint either.
  router.post("/financial-years", createFinancialYearController(deps));
  router.get("/financial-years", listFinancialYearsController(deps));
  router.get("/financial-years/:financialYearUuid", getFinancialYearController(deps));
  router.put("/financial-years/:financialYearUuid", updateFinancialYearController(deps));
  router.post("/financial-years/:financialYearUuid/open", openFinancialYearController(deps));
  router.post("/financial-years/:financialYearUuid/close", closeFinancialYearController(deps));
  router.post("/financial-years/:financialYearUuid/reopen", reopenFinancialYearController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/accounting', createDefaultAccountingRouter())`) — not used by tests. */
export function createDefaultAccountingRouter(): Router {
  return createAccountingRouter(createAccountingDependencies());
}
