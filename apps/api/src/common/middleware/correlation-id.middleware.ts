// Cross-cutting infrastructure (05_CODING_STANDARDS.md Ch.23.2): generates a
// correlation ID per request — or propagates one supplied by an upstream
// caller/load balancer via `X-Correlation-Id` — attaches it to `req` for
// downstream middleware/controllers, echoes it back on the response so a
// client can quote it when reporting an issue, and binds it into
// correlation-context.ts's AsyncLocalStorage so logger.config.ts's `mixin`
// can stamp it onto every log line for the duration of the request. Must run
// before logging.middleware.ts.
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { runWithCorrelationId } from "../logging/correlation-context";

const CORRELATION_ID_HEADER = "x-correlation-id";

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[CORRELATION_ID_HEADER];
  const correlationId = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();

  req.correlationId = correlationId;
  res.setHeader("X-Correlation-Id", correlationId);

  runWithCorrelationId(correlationId, next);
}
