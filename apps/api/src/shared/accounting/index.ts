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
import { createFiscalPeriodController } from "./presentation/controllers/v1/create-fiscal-period.controller";
import { getFiscalPeriodController } from "./presentation/controllers/v1/get-fiscal-period.controller";
import { updateFiscalPeriodController } from "./presentation/controllers/v1/update-fiscal-period.controller";
import { listFiscalPeriodsController } from "./presentation/controllers/v1/list-fiscal-periods.controller";
import { softCloseFiscalPeriodController } from "./presentation/controllers/v1/soft-close-fiscal-period.controller";
import { closeFiscalPeriodController } from "./presentation/controllers/v1/close-fiscal-period.controller";
import { reopenFiscalPeriodController } from "./presentation/controllers/v1/reopen-fiscal-period.controller";
import { createCurrencyController } from "./presentation/controllers/v1/create-currency.controller";
import { getCurrencyController } from "./presentation/controllers/v1/get-currency.controller";
import { updateCurrencyController } from "./presentation/controllers/v1/update-currency.controller";
import { listCurrenciesController } from "./presentation/controllers/v1/list-currencies.controller";
import { activateCurrencyController } from "./presentation/controllers/v1/activate-currency.controller";
import { deactivateCurrencyController } from "./presentation/controllers/v1/deactivate-currency.controller";
import { createExchangeRateController } from "./presentation/controllers/v1/create-exchange-rate.controller";
import { getExchangeRateController } from "./presentation/controllers/v1/get-exchange-rate.controller";
import { listExchangeRatesController } from "./presentation/controllers/v1/list-exchange-rates.controller";

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

  // --- Fiscal Period ---
  // `validateFiscalPeriodOpen` is deliberately not exposed here, same reason
  // as `validateFinancialYearOpen` above. There is no `open` endpoint either
  // — Ch.6.5's lifecycle diagram documents no transition into Open other
  // than initial creation (Business/Repository milestones' own finding).
  router.post("/fiscal-periods", createFiscalPeriodController(deps));
  router.get("/fiscal-periods", listFiscalPeriodsController(deps));
  router.get("/fiscal-periods/:fiscalPeriodUuid", getFiscalPeriodController(deps));
  router.put("/fiscal-periods/:fiscalPeriodUuid", updateFiscalPeriodController(deps));
  router.post("/fiscal-periods/:fiscalPeriodUuid/soft-close", softCloseFiscalPeriodController(deps));
  router.post("/fiscal-periods/:fiscalPeriodUuid/close", closeFiscalPeriodController(deps));
  router.post("/fiscal-periods/:fiscalPeriodUuid/reopen", reopenFiscalPeriodController(deps));

  // --- Currency ---
  // No `X-Tenant-Id` header on any of these — Currency is platform-owned
  // reference data (00_BUSINESS_RULES.md Ch.7.5, 06_DATABASE_STANDARDS.md
  // MT-005), mirroring Authorization's `/permissions` mount.
  router.post("/currencies", createCurrencyController(deps));
  router.get("/currencies", listCurrenciesController(deps));
  router.get("/currencies/:currencyUuid", getCurrencyController(deps));
  router.put("/currencies/:currencyUuid", updateCurrencyController(deps));
  router.post("/currencies/:currencyUuid/activate", activateCurrencyController(deps));
  router.post("/currencies/:currencyUuid/deactivate", deactivateCurrencyController(deps));

  // --- Exchange Rate ---
  // Tenant-owned (MT-001), unlike Currency above — every route requires
  // `X-Tenant-Id`. No update/remove endpoint — an Exchange Rate is an
  // immutable historical time series once created (00_BUSINESS_RULES.md
  // Ch.31.5/EXR-002); a correction is a new, dated rate entry.
  router.post("/exchange-rates", createExchangeRateController(deps));
  router.get("/exchange-rates", listExchangeRatesController(deps));
  router.get("/exchange-rates/:exchangeRateUuid", getExchangeRateController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/accounting', createDefaultAccountingRouter())`) — not used by tests. */
export function createDefaultAccountingRouter(): Router {
  return createAccountingRouter(createAccountingDependencies());
}
