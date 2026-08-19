import type { ApiError } from "@/services/api-client";

// ERR-002/003: known Authorization error codes (mirroring the backend's own
// domain-error-http-mapping.ts) map to specific, actionable copy; anything
// unmapped falls back to a safe generic message.
const AUTHORIZATION_ERROR_MESSAGES: Record<string, string> = {
  AUTHZ_ROLE_NOT_FOUND: "This Role could not be found. It may have been removed.",
  AUTHZ_PERMISSION_NOT_FOUND: "This Permission could not be found.",
  AUTHZ_ROLE_PERMISSION_NOT_FOUND: "This Permission is not currently granted to this Role.",
  AUTHZ_USER_ROLE_NOT_FOUND: "This Role is not currently assigned to this User.",
  AUTHZ_INVALID_ROLE_STATUS_TRANSITION: "That status change isn't allowed from this Role's current status.",
  AUTHZ_DUPLICATE_ROLE_NAME: "A Role with this name already exists.",
  AUTHZ_DUPLICATE_PERMISSION_ASSIGNMENT: "This Permission is already granted to this Role.",
  AUTHZ_DUPLICATE_ROLE_ASSIGNMENT: "This Role is already assigned to this User.",
  AUTHZ_ROLE_NOT_ASSIGNABLE: "A Retired Role cannot be assigned to a new User.",
  AUTHZ_DOMAIN_ERROR: "Please check the highlighted fields and try again.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getAuthorizationErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return AUTHORIZATION_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
