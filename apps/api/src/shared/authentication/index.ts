// Module entry point — mounts this module's Express router
// (04_FOLDER_STRUCTURE.md Ch.6.3: "index.ts mounts the module's Express
// router"). `server.ts`/`module-registry.ts` are still empty stubs (no
// Express `app` exists yet anywhere in the repo), so there is nothing live
// to actually mount onto — this exports the router for whatever bootstraps
// the app later. `createAuthenticationRouter` takes `deps` explicitly (no
// eager construction here) so importing this file never has a side effect
// of reading environment variables or touching Prisma — tests build the
// router with fake deps instead.
import { Router } from "express";
import { AuthenticationDependencies, createAuthenticationDependencies } from "./business/authentication.composition";
import { loginController } from "./presentation/controllers/v1/login.controller";
import { verifyMfaController } from "./presentation/controllers/v1/verify-mfa.controller";
import { refreshController } from "./presentation/controllers/v1/refresh.controller";
import { logoutController } from "./presentation/controllers/v1/logout.controller";
import { forgotPasswordController } from "./presentation/controllers/v1/forgot-password.controller";
import { resetPasswordController } from "./presentation/controllers/v1/reset-password.controller";

export function createAuthenticationRouter(deps: AuthenticationDependencies): Router {
  const router = Router();

  router.post("/login", loginController(deps));
  router.post("/mfa/verify", verifyMfaController(deps));
  router.post("/refresh", refreshController(deps));
  router.post("/logout", logoutController(deps));
  router.post("/forgot-password", forgotPasswordController(deps));
  router.post("/reset-password", resetPasswordController(deps));

  return router;
}

/** Real-dependency router for actual runtime mounting (e.g. `app.use('/api/v1/auth', createDefaultAuthenticationRouter())`) — not used by tests. */
export function createDefaultAuthenticationRouter(): Router {
  return createAuthenticationRouter(createAuthenticationDependencies());
}
