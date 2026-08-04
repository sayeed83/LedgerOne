// 03_ARCHITECTURE.md Ch.6.7 module manifest — Decision 6.8.2: Foundation
// modules follow this identically to Business Capability modules, no
// exception. This module previously had no `module.manifest.ts` at all
// (Authentication, Organization, and Authorization each had an empty stub;
// this one was missing entirely) — an inconsistency flagged by the
// Foundation Readiness Review, corrected here. Every list below is honestly
// empty: this module mounts an Express router directly (module-registry.ts
// imports `createDefaultUserManagementRouter` from this module's
// `index.ts`), which is not a published contract in Ch.6.6.1's sense (an
// in-process method interface another module's Business layer calls) — no
// other module currently calls into this one, and no Domain Event bus
// exists yet (Ch.14 infra not built), so this module emits none and
// subscribes to none.
import { ModuleManifest } from "../../common/types/module-manifest.interface";

export const userManagementManifest: ModuleManifest = {
  name: "UserManagement",
  description: "Owns the User aggregate — identity records scoped to a Tenant/Company/Branch/Department, independent of how a User authenticates.",
  publishes: {
    contracts: [],
    events: [],
  },
  consumes: {
    contracts: [],
    events: [],
  },
};

export default userManagementManifest;
