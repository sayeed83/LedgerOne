// Standard response envelopes (07_REST_API_STANDARDS.md RES-001/ERR-001).
// `correlationId` is omitted rather than fabricated — no correlation-id
// middleware exists yet (that file is an empty stub in common/middleware/,
// out of scope for this task), mirroring Accounting's own
// response-envelope.ts exactly.
import { Response } from "express";
import { ZodIssue } from "zod";

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
