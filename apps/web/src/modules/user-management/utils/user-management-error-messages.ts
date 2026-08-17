import type { ApiError } from "@/services/api-client";

// ERR-002/003: known User Management error codes (mirroring the backend's
// own domain-error-http-mapping.ts) map to specific, actionable copy;
// anything unmapped falls back to a safe generic message — never the raw
// server exception text. `Record<string, string>` rather than
// `Partial<Record<ApiError["code"], string>>` since `ApiError["code"]`'s
// type union is Authentication's own error codes — User Management's codes
// are a different, module-specific set (mirrors organization-error-messages.ts).
const USER_MANAGEMENT_ERROR_MESSAGES: Record<string, string> = {
  USR_USER_NOT_FOUND: "This User could not be found. They may have been removed.",
  USR_INVALID_STATUS_TRANSITION: "That status change isn't allowed from this User's current status.",
  USR_DUPLICATE_EMAIL: "A User with this email already exists in this Tenant.",
  USR_USER_NOT_ACTIVE: "This action requires the User to be Active.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getUserManagementErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return USER_MANAGEMENT_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
