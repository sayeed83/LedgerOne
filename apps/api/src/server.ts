// Express application bootstrap (04_FOLDER_STRUCTURE.md: "creates the
// Express app, mounts routers, calls app.listen"). `createApp()` is the
// pure, side-effect-free part (no `.listen()`) so tests can exercise the
// real app via supertest without starting a server; `main()` is only
// invoked when this file is actually run (`npm run dev`/`start`), not when
// it's imported.
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import pino from "pino";
import { registerModules } from "./module-registry";
import { pingDatabase } from "./database/client";

// The repo's single, shared `.env` lives at the monorepo root, not per-app
// (matching scripts/db/migrate.sh's `source "$ROOT_DIR/.env"` convention) —
// `dotenv`'s cwd-relative default wouldn't find it when this app runs from
// its own working directory. Path assumes running from source (`tsx`/
// ts-jest, i.e. `npm run dev`/tests) — real deployments never read this
// file at all, per its own header comment (env vars are injected directly
// by AWS Secrets Manager/ECS there).
loadEnv({ path: resolve(__dirname, "../../../.env") });

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

export function createApp(): Express {
  const app = express();

  app.use(helmet()); // SEC-API-001
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
      credentials: true, // required for the httpOnly refresh-token cookie (SESS-002) to be sent/read cross-origin
    }), // SEC-API-002 — explicit allow-list, never a wildcard
  );
  app.use(compression());
  app.use(express.json());

  // 10_DEPLOYMENT_ARCHITECTURE.md HC-001–004: unauthenticated, not
  // tenant-scoped, not rate-limited, bare `{status}` body (not the
  // RES-001 `{data, meta}` envelope — HC-004 carves out this exception).
  app.get("/health", async (_req: Request, res: Response) => {
    const isDatabaseReachable = await pingDatabase();
    res.status(isDatabaseReachable ? 200 : 503).json({ status: isDatabaseReachable ? "ok" : "error" });
  });

  registerModules(app);

  // Minimal safety net so an error that escapes a router doesn't crash the
  // process or hang the request. This is NOT the centralized DomainError→
  // HTTP mapping middleware described in 05_CODING_STANDARDS.md Ch.18.5/
  // Ch.31.5 (that remains out of scope — an empty stub at
  // common/middleware/error-handler.middleware.ts) — Authentication's own
  // routes already map their DomainErrors before an error would ever reach
  // this point (presentation/support/handle-domain-errors.ts).
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
  });

  return app;
}

function main(): void {
  const app = createApp();
  const port = Number(process.env.API_PORT ?? 4000);
  app.listen(port, () => {
    logger.info(`LedgerOne API listening on port ${port}`);
  });
}

if (require.main === module) {
  main();
}
