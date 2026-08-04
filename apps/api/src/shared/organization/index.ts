// Module entry point — mounts this module's Express router
// (04_FOLDER_STRUCTURE.md Ch.6.3: "index.ts mounts the module's Express
// router"), matching the Authentication module's own index.ts.
// `createOrganizationRouter` takes `deps` explicitly (no eager construction
// here) so importing this file never has a side effect of touching Prisma —
// tests build the router with fake deps instead.
//
// Route segment note: the endpoints below use the singular `/organization`
// (as specified for this module), which departs from 07_REST_API_STANDARDS.md
// URI-002's plural-noun convention. Flagged, not silently "corrected" —
// `/organization` names the module's single root aggregate (Tenant, i.e.
// "the Organization"), analogous to how `/auth` (also singular) is already
// the precedent for a module-root path in this codebase.
import { Router } from "express";
import { OrganizationDependencies, createOrganizationDependencies } from "./business/organization.composition";
import { createTenantController } from "./presentation/controllers/v1/create-tenant.controller";
import { getTenantController } from "./presentation/controllers/v1/get-tenant.controller";
import { updateTenantController } from "./presentation/controllers/v1/update-tenant.controller";
import { activateTenantController } from "./presentation/controllers/v1/activate-tenant.controller";
import { suspendTenantController } from "./presentation/controllers/v1/suspend-tenant.controller";
import { deactivateTenantController } from "./presentation/controllers/v1/deactivate-tenant.controller";
import { getTenantSettingsController } from "./presentation/controllers/v1/get-tenant-settings.controller";
import { updateTenantSettingsController } from "./presentation/controllers/v1/update-tenant-settings.controller";
import { getTenantSubscriptionController } from "./presentation/controllers/v1/get-tenant-subscription.controller";
import { updateTenantSubscriptionController } from "./presentation/controllers/v1/update-tenant-subscription.controller";
import { createCompanyController } from "./presentation/controllers/v1/create-company.controller";
import { getCompanyController } from "./presentation/controllers/v1/get-company.controller";
import { updateCompanyController } from "./presentation/controllers/v1/update-company.controller";
import { activateCompanyController } from "./presentation/controllers/v1/activate-company.controller";
import { closeCompanyController } from "./presentation/controllers/v1/close-company.controller";
import { listCompaniesByTenantController } from "./presentation/controllers/v1/list-companies-by-tenant.controller";
import { createBranchController } from "./presentation/controllers/v1/create-branch.controller";
import { getBranchController } from "./presentation/controllers/v1/get-branch.controller";
import { updateBranchController } from "./presentation/controllers/v1/update-branch.controller";
import { listBranchesByCompanyController } from "./presentation/controllers/v1/list-branches-by-company.controller";
import { createDepartmentController } from "./presentation/controllers/v1/create-department.controller";
import { getDepartmentController } from "./presentation/controllers/v1/get-department.controller";
import { updateDepartmentController } from "./presentation/controllers/v1/update-department.controller";
import { listDepartmentsByCompanyController } from "./presentation/controllers/v1/list-departments-by-company.controller";

export function createOrganizationRouter(deps: OrganizationDependencies): Router {
  const router = Router();

  // --- Tenant ---
  router.post("/tenants", createTenantController(deps));
  router.get("/tenants/:tenantUuid", getTenantController(deps));
  router.put("/tenants/:tenantUuid", updateTenantController(deps));
  router.post("/tenants/:tenantUuid/activate", activateTenantController(deps));
  router.post("/tenants/:tenantUuid/suspend", suspendTenantController(deps));
  router.post("/tenants/:tenantUuid/deactivate", deactivateTenantController(deps));
  router.get("/tenants/:tenantUuid/settings", getTenantSettingsController(deps));
  router.put("/tenants/:tenantUuid/settings", updateTenantSettingsController(deps));
  router.get("/tenants/:tenantUuid/subscription", getTenantSubscriptionController(deps));
  router.put("/tenants/:tenantUuid/subscription", updateTenantSubscriptionController(deps));

  // --- Company ---
  router.post("/companies", createCompanyController(deps));
  router.get("/companies/:companyUuid", getCompanyController(deps));
  router.put("/companies/:companyUuid", updateCompanyController(deps));
  router.post("/companies/:companyUuid/activate", activateCompanyController(deps));
  router.post("/companies/:companyUuid/close", closeCompanyController(deps));
  router.get("/tenants/:tenantUuid/companies", listCompaniesByTenantController(deps));

  // --- Branch ---
  router.post("/branches", createBranchController(deps));
  router.get("/branches/:branchUuid", getBranchController(deps));
  router.put("/branches/:branchUuid", updateBranchController(deps));
  router.get("/companies/:companyUuid/branches", listBranchesByCompanyController(deps));

  // --- Department ---
  router.post("/departments", createDepartmentController(deps));
  router.get("/departments/:departmentUuid", getDepartmentController(deps));
  router.put("/departments/:departmentUuid", updateDepartmentController(deps));
  router.get("/companies/:companyUuid/departments", listDepartmentsByCompanyController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/organization', createDefaultOrganizationRouter())`) — not used by tests. */
export function createDefaultOrganizationRouter(): Router {
  return createOrganizationRouter(createOrganizationDependencies());
}
