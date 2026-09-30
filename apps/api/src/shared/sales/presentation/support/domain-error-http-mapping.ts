// Maps this module's Domain errors to the HTTP status/code pair
// (07_REST_API_STANDARDS.md §5.3/§9.4). The handbook's documented mechanism
// for this is a single centralized error-handling middleware
// (05_CODING_STANDARDS.md Ch.18.5/Ch.31.5) — out of scope for this task.
// Kept here as a plain function, called from each controller's own catch
// block, so the mapping table still lives in exactly one place rather than
// being duplicated per controller; this is an interim measure until the
// real centralized middleware exists, mirroring Inventory's own
// domain-error-http-mapping.ts exactly.
import { DomainError, CustomerNotFoundError, CustomerAlreadyExistsError } from "../../business/sales-errors";

export interface HttpErrorMapping {
  status: number;
  code: string;
}

export function mapDomainErrorToHttp(error: DomainError): HttpErrorMapping {
  if (error instanceof CustomerNotFoundError) {
    return { status: 404, code: "SLS_CUSTOMER_NOT_FOUND" };
  }
  if (error instanceof CustomerAlreadyExistsError) {
    return { status: 409, code: "SLS_CUSTOMER_ALREADY_EXISTS" };
  }
  // Per 07_REST_API_STANDARDS.md §9.4's default for module-specific business
  // errors not individually listed.
  return { status: 422, code: "SLS_DOMAIN_ERROR" };
}
