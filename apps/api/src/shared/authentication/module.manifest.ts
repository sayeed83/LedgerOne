// 03_ARCHITECTURE.md Ch.6.7 module manifest — Decision 6.8.2: Foundation
// modules follow this identically to Business Capability modules, no
// exception. Every list below is honestly empty: this module mounts an
// Express router directly (module-registry.ts imports `createDefault
// AuthenticationRouter` from this module's `index.ts`), which is not a
// published contract in Ch.6.6.1's sense (an in-process method interface
// another module's Business layer calls) — no other module currently calls
// into this one, and no Domain Event bus exists yet (Ch.14 infra not
// built), so this module emits none and subscribes to none.
import { ModuleManifest } from "../../common/types/module-manifest.interface";

export const authenticationManifest: ModuleManifest = {
  name: "Authentication",
  description: "Issues and verifies session credentials (password + MFA login, JWT access/refresh tokens, password reset).",
  publishes: {
    contracts: [],
    events: [],
  },
  consumes: {
    contracts: [],
    events: [],
  },
};

export default authenticationManifest;
