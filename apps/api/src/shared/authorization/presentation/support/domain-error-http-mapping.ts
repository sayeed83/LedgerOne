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
  RoleNotFoundError,
  InvalidRoleStatusTransitionError,
  RolePermissionNotFoundError,
  UserRoleNotFoundError,
  DuplicateRoleNameError,
  PermissionNotFoundError,
  DuplicatePermissionAssignmentError,
  DuplicateRoleAssignmentError,
  RoleNotAssignableError,
  PermissionDeniedError,
} from "../../business/authorization-errors";

export interface HttpErrorMapping {
  status: number;
  code: string;
}

export function mapDomainErrorToHttp(error: DomainError): HttpErrorMapping {
  if (error instanceof RoleNotFoundError) {
    return { status: 404, code: "AUTHZ_ROLE_NOT_FOUND" };
  }
  if (error instanceof PermissionNotFoundError) {
    return { status: 404, code: "AUTHZ_PERMISSION_NOT_FOUND" };
  }
  if (error instanceof RolePermissionNotFoundError) {
    return { status: 404, code: "AUTHZ_ROLE_PERMISSION_NOT_FOUND" };
  }
  if (error instanceof UserRoleNotFoundError) {
    return { status: 404, code: "AUTHZ_USER_ROLE_NOT_FOUND" };
  }
  if (error instanceof InvalidRoleStatusTransitionError) {
    return { status: 409, code: "AUTHZ_INVALID_ROLE_STATUS_TRANSITION" };
  }
  if (error instanceof DuplicateRoleNameError) {
    return { status: 409, code: "AUTHZ_DUPLICATE_ROLE_NAME" };
  }
  if (error instanceof DuplicatePermissionAssignmentError) {
    return { status: 409, code: "AUTHZ_DUPLICATE_PERMISSION_ASSIGNMENT" };
  }
  if (error instanceof DuplicateRoleAssignmentError) {
    return { status: 409, code: "AUTHZ_DUPLICATE_ROLE_ASSIGNMENT" };
  }
  if (error instanceof RoleNotAssignableError) {
    return { status: 403, code: "AUTHZ_ROLE_NOT_ASSIGNABLE" };
  }
  if (error instanceof PermissionDeniedError) {
    return { status: 403, code: "AUTHZ_PERMISSION_DENIED" };
  }
  // Per 07_REST_API_STANDARDS.md §9.4's default for module-specific business
  // errors not individually listed.
  return { status: 422, code: "AUTHZ_DOMAIN_ERROR" };
}
