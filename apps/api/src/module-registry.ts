// Aggregates each completed module's router onto the Express app —
// PROJECT_DIRECTORY.md: "Aggregates every module's module.manifest.ts into
// one catalog server.ts/worker.ts mount against," the physical
// implementation of 03_ARCHITECTURE.md Ch.6.7's module registry concept.
//
// Full manifest-driven aggregation (reading each module's
// `module.manifest.ts`) isn't built yet — every module's manifest file is
// still an empty stub, including Authentication's and Organization's own.
// Until that exists, this registers each completed module's router
// directly, by name. Authentication and Organization are the only modules
// implemented so far; Users and Roles are explicitly out of scope for this
// milestone and are not registered here.
import { Express } from "express";
import { createDefaultAuthenticationRouter } from "./shared/authentication";
import { createDefaultOrganizationRouter } from "./shared/organization";

export function registerModules(app: Express): void {
  app.use("/api/v1/auth", createDefaultAuthenticationRouter());
  app.use("/api/v1/organization", createDefaultOrganizationRouter());
}
