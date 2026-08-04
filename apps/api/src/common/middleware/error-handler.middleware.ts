// Centralized error-handling middleware (05_CODING_STANDARDS.md Ch.18.5/
// Ch.31.5). Each module already maps its own DomainError subclasses to HTTP
// responses before an error would ever reach this point
// (presentation/support/handle-domain-errors.ts, one copy per module) — this
// is only the final safety net for whatever escapes that: a programmer
// error, an unhandled promise rejection surfaced by Express, or anything
// thrown by code with no module-level handler (e.g. a future module that
// hasn't built its own yet). It never leaks a stack trace or error message
// to the client (05_CODING_STANDARDS.md Ch.22.3), only a generic message —
// same shape as every module's own `sendError` envelope
// (07_REST_API_STANDARDS.md RES-001/ERR-001) so a client can't tell whether
// a 500 came from a module or from here.
//
// Replaces the inline fallback previously defined directly in server.ts.
import { NextFunction, Request, Response } from "express";
import { logger } from "../logging/logger.config";

export function errorHandlerMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, correlationId: req.correlationId }, "Unhandled error");
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
}
