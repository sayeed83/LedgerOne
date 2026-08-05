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
import { createTaxGroupController } from "./presentation/controllers/v1/create-tax-group.controller";
import { getTaxGroupController } from "./presentation/controllers/v1/get-tax-group.controller";
import { updateTaxGroupController } from "./presentation/controllers/v1/update-tax-group.controller";
import { listTaxGroupsController } from "./presentation/controllers/v1/list-tax-groups.controller";
import { createTaxRuleController } from "./presentation/controllers/v1/create-tax-rule.controller";
import { getTaxRuleController } from "./presentation/controllers/v1/get-tax-rule.controller";
import { listTaxRulesController } from "./presentation/controllers/v1/list-tax-rules.controller";
import { createAccountGroupController } from "./presentation/controllers/v1/create-account-group.controller";
import { getAccountGroupController } from "./presentation/controllers/v1/get-account-group.controller";
import { updateAccountGroupController } from "./presentation/controllers/v1/update-account-group.controller";
import { listAccountGroupsController } from "./presentation/controllers/v1/list-account-groups.controller";
import { createAccountController } from "./presentation/controllers/v1/create-account.controller";
import { getAccountController } from "./presentation/controllers/v1/get-account.controller";
import { updateAccountController } from "./presentation/controllers/v1/update-account.controller";
import { listAccountsController } from "./presentation/controllers/v1/list-accounts.controller";
import { activateAccountController } from "./presentation/controllers/v1/activate-account.controller";
import { deactivateAccountController } from "./presentation/controllers/v1/deactivate-account.controller";
import { createJournalEntryController } from "./presentation/controllers/v1/create-journal-entry.controller";
import { getJournalEntryController } from "./presentation/controllers/v1/get-journal-entry.controller";
import { updateJournalEntryController } from "./presentation/controllers/v1/update-journal-entry.controller";
import { listJournalEntriesController } from "./presentation/controllers/v1/list-journal-entries.controller";
import { submitJournalEntryController } from "./presentation/controllers/v1/submit-journal-entry.controller";
import { rejectJournalEntryController } from "./presentation/controllers/v1/reject-journal-entry.controller";
import { postJournalEntryController } from "./presentation/controllers/v1/post-journal-entry.controller";
import { reverseJournalEntryController } from "./presentation/controllers/v1/reverse-journal-entry.controller";

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

  // --- Tax Group ---
  // Tenant-owned (MT-001), mirroring Financial Year's own `companyUuid`
  // ownership shape (00_BUSINESS_RULES.md Ch.67.13's "Finance Manager or
  // Company Administrator approval" implies Company-level configuration,
  // not platform-wide reference data). No delete/lifecycle endpoint — Ch.67
  // documents no state machine (Ch.67.5 — "static, low-change reference
  // data"), only a name that may be revised.
  router.post("/tax-groups", createTaxGroupController(deps));
  router.get("/tax-groups", listTaxGroupsController(deps));
  router.get("/tax-groups/:taxGroupUuid", getTaxGroupController(deps));
  router.put("/tax-groups/:taxGroupUuid", updateTaxGroupController(deps));

  // --- Tax Rule ---
  // Tenant-owned (MT-001), mirroring its parent Tax Group's ownership. No
  // update/remove endpoint — a Tax Rule is immutable once created (Ch.68.7
  // TXR-003 — "a rate correction requires a new, dated rule"), mirroring
  // Exchange Rate's own immutable-time-series posture.
  router.post("/tax-rules", createTaxRuleController(deps));
  router.get("/tax-rules", listTaxRulesController(deps));
  router.get("/tax-rules/:taxRuleUuid", getTaxRuleController(deps));

  // --- Account Group ---
  // Tenant-owned (MT-001), mirroring Tax Group's own `companyUuid`
  // ownership shape (00_BUSINESS_RULES.md Ch.18.13/Ch.17.13's "Company
  // Administrator approval" implies Company-level configuration, not
  // platform-wide reference data). No delete/lifecycle endpoint — Ch.18.5
  // documents no state machine ("largely static... platform-provided
  // standard groupings"), only name/accountType/parent that may be revised.
  router.post("/account-groups", createAccountGroupController(deps));
  router.get("/account-groups", listAccountGroupsController(deps));
  router.get("/account-groups/:accountGroupUuid", getAccountGroupController(deps));
  router.put("/account-groups/:accountGroupUuid", updateAccountGroupController(deps));

  // --- Account ---
  // Tenant-owned (MT-001), mirroring its parent Account Group's ownership.
  // No delete endpoint — an Account's lifecycle is Draft/Inactive -> Active
  // -> Inactive (00_BUSINESS_RULES.md Ch.17.5), never removed once created,
  // mirroring Currency's own activate/deactivate-only posture. `code`/
  // `accountType` are never revisable via the update endpoint (Ch.17.7
  // COA-004/COA-001). COA-003's deactivation-blocked-while-non-zero-balance
  // rule and COA-001's posted-immutability rule are deliberately NOT
  // enforced anywhere here — both require Ledger/Journal Entry data that
  // does not exist yet, a documented, intentional scope deferral to a
  // future Journal Entries module.
  router.post("/accounts", createAccountController(deps));
  router.get("/accounts", listAccountsController(deps));
  router.get("/accounts/:accountUuid", getAccountController(deps));
  router.put("/accounts/:accountUuid", updateAccountController(deps));
  router.post("/accounts/:accountUuid/activate", activateAccountController(deps));
  router.post("/accounts/:accountUuid/deactivate", deactivateAccountController(deps));

  // --- Journal Entry ---
  // Tenant-owned (MT-001), mirroring Account's own ownership shape. Ledger
  // Entry has NO endpoints of its own — Ch.19.18: "Only the Journal Entry
  // posting process may create Ledger entries — no direct, manual creation
  // or editing... is permitted through any interface." A Ledger Entry is
  // only ever an internal side effect of `POST .../post`, never a
  // separately addressable resource this API exposes. `submit`/`reject`/
  // `post`/`reverse` all take no request body (00_BUSINESS_RULES.md Ch.20.5
  // state transitions) — JRN-004's approval-threshold decision and APR-002's
  // segregation-of-duties are not implemented anywhere in this module
  // (no Approval Workflow module exists), so `submit`/`reject` are exposed
  // as plain, unconditional transitions the caller decides to invoke.
  router.post("/journal-entries", createJournalEntryController(deps));
  router.get("/journal-entries", listJournalEntriesController(deps));
  router.get("/journal-entries/:journalEntryUuid", getJournalEntryController(deps));
  router.put("/journal-entries/:journalEntryUuid", updateJournalEntryController(deps));
  router.post("/journal-entries/:journalEntryUuid/submit", submitJournalEntryController(deps));
  router.post("/journal-entries/:journalEntryUuid/reject", rejectJournalEntryController(deps));
  router.post("/journal-entries/:journalEntryUuid/post", postJournalEntryController(deps));
  router.post("/journal-entries/:journalEntryUuid/reverse", reverseJournalEntryController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/accounting', createDefaultAccountingRouter())`) — not used by tests. */
export function createDefaultAccountingRouter(): Router {
  return createAccountingRouter(createAccountingDependencies());
}
