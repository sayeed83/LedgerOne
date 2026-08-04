// One place that catches this module's DomainError subclasses and maps
// them to an HTTP response, so individual controllers don't each
// reimplement the same try/catch (05_CODING_STANDARDS.md Ch.18.5's "one
// central mapping, not duplicated per controller" — normally that's a
// centralized Express error-handling middleware, which is out of scope for
// this task; this is the interim substitute). Anything that is not a
// DomainError is rethrown — with no error-handling middleware registered
// yet, an unexpected/programmer error surfaces as an unhandled rejection
// rather than a graceful 500, which is a known, flagged gap.
import { Request, Response } from "express";
import { DomainError } from "../../business/organization-errors";
import { mapDomainErrorToHttp } from "./domain-error-http-mapping";
import { sendError } from "./response-envelope";

export type ControllerHandler = (req: Request, res: Response) => Promise<void>;

export function handleDomainErrors(handler: ControllerHandler): ControllerHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof DomainError) {
        const { status, code } = mapDomainErrorToHttp(error);
        sendError(res, status, code, error.message);
        return;
      }
      throw error;
    }
  };
}
