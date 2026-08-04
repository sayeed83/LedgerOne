// Module entry point — mounts this module's Express router
// (04_FOLDER_STRUCTURE.md Ch.6.3: "index.ts mounts the module's Express
// router"), matching Authentication's, Organization's, and User Management's
// own index.ts. `createAuthorizationRouter` takes `deps` explicitly (no
// eager construction here) so importing this file never has a side effect
// of touching Prisma — tests build the router with fake deps instead.
//
// Route ordering note: `GET /permissions` carries no `X-Tenant-Id`
// requirement (Permission is platform-owned, MT-005) while every `/roles`
// and `/users/:userUuid/roles` route does — no ordering conflict exists
// between them since they don't share a path prefix.
import { Router } from "express";
import { AuthorizationDependencies, createAuthorizationDependencies } from "./business/authorization.composition";
import { createRoleController } from "./presentation/controllers/v1/create-role.controller";
import { getRoleController } from "./presentation/controllers/v1/get-role.controller";
import { updateRoleController } from "./presentation/controllers/v1/update-role.controller";
import { retireRoleController } from "./presentation/controllers/v1/retire-role.controller";
import { listRolesController } from "./presentation/controllers/v1/list-roles.controller";
import { listPermissionsController } from "./presentation/controllers/v1/list-permissions.controller";
import { assignPermissionController } from "./presentation/controllers/v1/assign-permission.controller";
import { removePermissionController } from "./presentation/controllers/v1/remove-permission.controller";
import { listRolePermissionsController } from "./presentation/controllers/v1/list-role-permissions.controller";
import { assignRoleController } from "./presentation/controllers/v1/assign-role.controller";
import { removeRoleController } from "./presentation/controllers/v1/remove-role.controller";
import { listUserRolesController } from "./presentation/controllers/v1/list-user-roles.controller";

export function createAuthorizationRouter(deps: AuthorizationDependencies): Router {
  const router = Router();

  // --- Role ---
  router.post("/roles", createRoleController(deps));
  router.get("/roles", listRolesController(deps));
  router.get("/roles/:roleUuid", getRoleController(deps));
  router.put("/roles/:roleUuid", updateRoleController(deps));
  router.post("/roles/:roleUuid/retire", retireRoleController(deps));

  // --- Permission ---
  router.get("/permissions", listPermissionsController(deps));

  // --- Role Permissions ---
  router.get("/roles/:roleUuid/permissions", listRolePermissionsController(deps));
  router.post("/roles/:roleUuid/permissions", assignPermissionController(deps));
  router.delete("/roles/:roleUuid/permissions/:permissionKey", removePermissionController(deps));

  // --- User Roles ---
  router.get("/users/:userUuid/roles", listUserRolesController(deps));
  router.post("/users/:userUuid/roles", assignRoleController(deps));
  router.delete("/users/:userUuid/roles/:roleUuid", removeRoleController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/authorization', createDefaultAuthorizationRouter())`) — not used by tests. */
export function createDefaultAuthorizationRouter(): Router {
  return createAuthorizationRouter(createAuthorizationDependencies());
}
