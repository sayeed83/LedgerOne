// 03_ARCHITECTURE.md Ch.6.7 module manifest — Decision 6.8.2: Foundation
// modules follow this identically to Business Capability modules, no
// exception. Every list below is honestly empty: this module mounts an
// Express router directly (module-registry.ts imports `createDefault
// AuthorizationRouter` from this module's `index.ts`), which is not a
// published contract in Ch.6.6.1's sense (an in-process method interface
// another module's Business layer calls) — no other module currently calls
// into this one, and no Domain Event bus exists yet (Ch.14 infra not
// built), so this module emits none and subscribes to none.
//
// Note (03_ARCHITECTURE.md line 1859): this module provides the RBAC
// *mechanism* only (roles, permission assignment, checking) — it has no
// hardcoded knowledge of any other module's specific permission keys. Each
// future Business module declares its own `module.resource.action`
// permission keys in its own manifest as it defines them; none exist yet
// for any module, including this one's own endpoints (see
// common/middleware/permission.middleware.ts's header comment).
import { ModuleManifest } from "../../common/types/module-manifest.interface";

export const authorizationManifest: ModuleManifest = {
  name: "Authorization",
  description: "Provides the RBAC mechanism (Role, Permission, RolePermission, UserRole) and the authoritative permission-check used to gate operations.",
  publishes: {
    contracts: [],
    events: [],
  },
  consumes: {
    contracts: [],
    events: [],
  },
};

export default authorizationManifest;
