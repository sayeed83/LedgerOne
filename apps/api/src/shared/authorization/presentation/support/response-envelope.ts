// Standard response envelopes (07_REST_API_STANDARDS.md RES-001/ERR-001).
// `correlationId` is omitted rather than fabricated — no correlation-id
// middleware exists yet (that file is an empty stub in common/middleware/,
// out of scope for this task).
import { Response } from "express";
import { ZodIssue } from "zod";

export function sendData(res: Response, status: number, data: unknown): void {
  res.status(status).json({ data });
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

/**
 * `204 No Content` (07_REST_API_STANDARDS.md HTTP-005) — this module is the
 * first to expose a removal endpoint (`DELETE /roles/:roleUuid/permissions/
 * :permissionKey`, `DELETE /users/:userUuid/roles/:roleUuid`), so no prior
 * module's `response-envelope.ts` needed this. No body per RES-001's
 * `204`-has-no-body rule.
 */
export function sendNoContent(res: Response): void {
  res.status(204).end();
}
