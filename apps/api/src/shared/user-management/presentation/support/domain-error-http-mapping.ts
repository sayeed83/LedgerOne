// Maps this module's Domain errors to the HTTP status/code pair
// (07_REST_API_STANDARDS.md §5.3/§9.4). The handbook's documented mechanism
// for this is a single centralized error-handling middleware
// (05_CODING_STANDARDS.md Ch.18.5/Ch.31.5) — out of scope for this task.
// Kept here as a plain function, called from each controller's own catch
// block, so the mapping table still lives in exactly one place rather than
// being duplicated per controller; this is an interim measure until the
// real centralized middleware exists.
import {
  DomainError,
  UserNotFoundError,
  InvalidUserStatusTransitionError,
  DuplicateUserEmailError,
  UserNotActiveError,
} from "../../business/user-management-errors";

export interface HttpErrorMapping {
  status: number;
  code: string;
}

export function mapDomainErrorToHttp(error: DomainError): HttpErrorMapping {
  if (error instanceof UserNotFoundError) {
    return { status: 404, code: "USR_USER_NOT_FOUND" };
  }
  if (error instanceof InvalidUserStatusTransitionError) {
    return { status: 409, code: "USR_INVALID_STATUS_TRANSITION" };
  }
  if (error instanceof DuplicateUserEmailError) {
    return { status: 409, code: "USR_DUPLICATE_EMAIL" };
  }
  if (error instanceof UserNotActiveError) {
    return { status: 403, code: "USR_USER_NOT_ACTIVE" };
  }
  // Per 07_REST_API_STANDARDS.md §9.4's default for module-specific business
  // errors not individually listed.
  return { status: 422, code: "USR_DOMAIN_ERROR" };
}
