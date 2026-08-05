// Standard response envelopes (07_REST_API_STANDARDS.md RES-001/ERR-001).
// `correlationId` is omitted rather than fabricated — no correlation-id
// middleware exists yet (that file is an empty stub in common/middleware/,
// out of scope for this task).
import { Response } from "express";
import { ZodIssue } from "zod";

// `meta` (07_REST_API_STANDARDS.md Ch.14.3's `meta.pagination`) is optional
// and additive — every existing caller passing 3 args is unaffected. Added
// for the General Ledger read model's cursor-paginated endpoints; no other
// endpoint in this module is paginated yet (a pre-existing, separately
// flagged gap this milestone does not retrofit onto every other list
// endpoint).
export function sendData(res: Response, status: number, data: unknown, meta?: Record<string, unknown>): void {
  res.status(status).json(meta ? { data, meta } : { data });
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: ZodIssue[],
): void {
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}
