import type { ApiError } from "@/services/api-client";

// ERR-002/003: known Sales error codes (mirroring the backend's own
// domain-error-http-mapping.ts) map to specific, actionable copy; anything
// unmapped falls back to a safe generic message — never the raw server
// exception text, mirroring Inventory's own inventory-error-messages.ts.
const SALES_ERROR_MESSAGES: Record<string, string> = {
  SLS_CUSTOMER_NOT_FOUND: "This Customer could not be found. It may have been removed.",
  SLS_CUSTOMER_ALREADY_EXISTS: "A Customer with this name already exists in this Company.",
  SLS_DOMAIN_ERROR: "Please check the highlighted fields and try again.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getSalesErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return SALES_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
