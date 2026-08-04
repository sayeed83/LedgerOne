// Cross-cutting infrastructure (05_CODING_STANDARDS.md Ch.23 — structured
// request logging, no `console.log`). Built on `pino-http` (already a
// declared dependency, unused until now) rather than hand-rolled
// request/response logging, using the shared `logger` (logger.config.ts) so
// every request log line goes through the same Pino instance. Must run
// after correlation-id.middleware.ts: that middleware already binds the
// correlation ID into correlation-context.ts's AsyncLocalStorage for the
// rest of the request, which `logger`'s own `mixin` reads — no need to
// thread it through here separately.
import pinoHttp from "pino-http";
import { logger } from "../logging/logger.config";

export const loggingMiddleware = pinoHttp({
  logger,
  // Health checks are polled frequently by the load balancer
  // (10_DEPLOYMENT_ARCHITECTURE.md HC-001) — logging every one at "info"
  // would drown out real request logs.
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
});
