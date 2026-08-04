// Module entry point — mounts this module's Express router
// (04_FOLDER_STRUCTURE.md Ch.6.3: "index.ts mounts the module's Express
// router"), matching Authentication's and Organization's own index.ts.
// `createUserManagementRouter` takes `deps` explicitly (no eager
// construction here) so importing this file never has a side effect of
// touching Prisma — tests build the router with fake deps instead.
//
// Route ordering note: `GET /search` is registered before `GET /:userUuid`
// — Express matches routes in registration order, and a literal segment
// registered after a param route would never be reached (the param route
// would greedily match "search" as a `userUuid` value first).
import { Router } from "express";
import { UserManagementDependencies, createUserManagementDependencies } from "./business/user-management.composition";
import { createUserController } from "./presentation/controllers/v1/create-user.controller";
import { inviteUserController } from "./presentation/controllers/v1/invite-user.controller";
import { searchUsersController } from "./presentation/controllers/v1/search-users.controller";
import { listUsersController } from "./presentation/controllers/v1/list-users.controller";
import { getUserController } from "./presentation/controllers/v1/get-user.controller";
import { updateUserController } from "./presentation/controllers/v1/update-user.controller";
import { activateUserController } from "./presentation/controllers/v1/activate-user.controller";
import { suspendUserController } from "./presentation/controllers/v1/suspend-user.controller";
import { deactivateUserController } from "./presentation/controllers/v1/deactivate-user.controller";

export function createUserManagementRouter(deps: UserManagementDependencies): Router {
  const router = Router();

  router.post("/", createUserController(deps));
  router.post("/invite", inviteUserController(deps));
  router.get("/search", searchUsersController(deps));
  router.get("/", listUsersController(deps));
  router.get("/:userUuid", getUserController(deps));
  router.put("/:userUuid", updateUserController(deps));
  router.post("/:userUuid/activate", activateUserController(deps));
  router.post("/:userUuid/suspend", suspendUserController(deps));
  router.post("/:userUuid/deactivate", deactivateUserController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/users', createDefaultUserManagementRouter())`) — not used by tests. */
export function createDefaultUserManagementRouter(): Router {
  return createUserManagementRouter(createUserManagementDependencies());
}
