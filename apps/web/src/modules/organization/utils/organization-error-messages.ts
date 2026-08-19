import type { ApiError } from "@/services/api-client";

// ERR-002/003: known Organization error codes (mirroring the backend's own
// domain-error-http-mapping.ts) map to specific, actionable copy; anything
// unmapped falls back to a safe generic message — never the raw server
// exception text. `Record<string, string>` rather than `Partial<Record<
// ApiError["code"], string>>` because `ApiError["code"]`'s type union is
// Authentication's own error codes (`AuthErrorCode`) — Organization's codes
// are a different, module-specific set the shared `ApiError` type doesn't
// enumerate.
const ORGANIZATION_ERROR_MESSAGES: Record<string, string> = {
  ORG_TENANT_NOT_FOUND: "This Tenant could not be found. It may have been removed.",
  ORG_TENANT_SETTINGS_NOT_FOUND: "This Tenant's settings could not be found.",
  ORG_TENANT_SUBSCRIPTION_NOT_FOUND: "This Tenant's subscription could not be found.",
  ORG_TENANT_SETTINGS_ALREADY_EXISTS: "This Tenant's settings have already been set up.",
  ORG_TENANT_SUBSCRIPTION_ALREADY_EXISTS: "This Tenant's subscription has already been set up.",
  ORG_INVALID_STATUS_TRANSITION: "That status change isn't allowed from the Tenant's current status.",
  ORG_TENANT_NOT_ACTIVE: "This action requires the Tenant to be Active.",
  ORG_COMPANY_NOT_FOUND: "This Company could not be found. It may have been removed.",
  ORG_BRANCH_NOT_FOUND: "This Branch could not be found. It may have been removed.",
  ORG_DEPARTMENT_NOT_FOUND: "This Department could not be found. It may have been removed.",
  ORG_INVALID_COMPANY_STATUS_TRANSITION: "That status change isn't allowed from the Company's current status.",
  ORG_DUPLICATE_COMPANY_CODE: "A Company with this code already exists for this Tenant.",
  ORG_DUPLICATE_BRANCH_CODE: "A Branch with this code already exists for this Company.",
  ORG_DUPLICATE_DEPARTMENT_CODE: "A Department with this code already exists for this Company.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getOrganizationErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return ORGANIZATION_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
